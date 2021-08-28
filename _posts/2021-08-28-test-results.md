---
layout: posts
title: "딥러닝 requests 속도 개선하기 - 2) 테스트 결과" 
categories:
  - datascience
tags:
  - deeplearning, requests, http, web_server, 속도, 개선
use_math: true
comments: true
---

# requests 테스트

테스트는 다음과 같은 조건으로 한다.  (MP==멀티 프로세스, MT==멀티 스레드)

- 서버 구성 : single, MP, MT
- requests  방식 : single, MP, MT

서버 구성은 gunicorn 실행 시 option을 달리하며 구현할 수 있고, request 방식은 이전의 포스트([[python] 멀티 프로세스](https://www.notion.so/python-fba93794b4064ec3bfec8413d16ef297))에 정리한 것을 참조하여 구현할 수 있다. 

테스트 하기 전엔 응답 처리 시간만 고려 대상이었으나, 관찰 결과 GPU 메모리 사용량 또한 살펴봐야한다는 걸 깨달았다.

결과부터 말하자면,  
서버 구성과 requests 방식 둘 다 MT로 했을 때, GPU 메모리 사용량을 크게 늘리지 않으면서도 처리 속도를 기존 대비 37% 이상 줄일 수 있었다.

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213801-c1f8f7f7-85d4-4b4a-b3ab-8cb6524aafca.png'></p>
<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213787-fa3d31d3-9034-45d7-871d-2859078e7d88.png'></p>

## flask 단독

---

GPU 메모리 사용량은 다음 명령어로 살펴볼 수 있다.

```java
watch -d -n 0.5 nvidia-smi
```

1. 처리 시간

응답(처리 파일) 개수는 [1, 10, 50, 100, 1000]개로 증가시켜 보았고, 각각에 따른 멀티 프로세스의 개수는 [1, 2, 2, 5, 20]개로 구성해보았다.

멀티 프로세스 개수 선정의 기준은 없고, 테스트할 조건이 많아 임의적으로 구성하였다.

|file_len|flask (sec)|flask_mp (sec)|flask_mt (sec)|ratio (%)|req multi number|
|----|----|----|----|----|----|
|1|0.350475|0.349153|0.33332|99.622653|1|
|10|3.002874|2.194115|2.227561|73.067182|2|
|50|14.698248|10.683933|10.552662|72.688476|2|
|100|29.604961|	19.166628|	19.37616|	64.74127|	5|
|1000|	305.590274|	208.525319|	212.18949|	68.236896|	20|

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213789-e9092aa1-de46-49f8-94b7-9c8aee81e29f.png'></p>

single flask 서버에도 requests를 멀티로 찌르면 응답을 멀티로 하는 것을 알 수 있다.

조건이 각각 달라 MP, MT 중 어느 것이 더 낫다라고 현시점에서 단정할 수 없지만,

파일개수 100일 때, requests가 MP/MT 5 인 경우 single로 했을 때에 비해 처리 속도가 10초 이상 줄어들었음을 알 수 있다.

2. GPU Memory 사용량 - (참조 : [MiB와 MB는 어떻게 다른가?](https://brunch.co.kr/@leedongins/133))

하지만 해당 방식은 requests 의 멀티 구성(multi number)을 늘리는 만큼 GPU 메모리 사용량이 대략 선형적으로 증가한다는 단점이 있다. (MP 2 일 때를 보면 file_len의 영향도 있는 것으로 보임)

또한 그렇게 늘어난, 해당 프로세스에 물려있는 GPU 메모리는 따로 초기화하는 과정이 없는 이상 계속 물려 있는 것으로 보인다.

|file_len|	requests MP 개수|	GPU 메모리 사용량 (MiB)|
|----|----|----|
|1|	1|	2467|
|10|	2|	3137|
|50|	2|	3669|
|100|	5|	4512|
|1000|	20|	9177|

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213790-e9a15ee0-6f6c-4764-8617-21053e08d329.png'></p>


처리 속도가 30% 이상 감소한다고 할지라도 GPU 메모리 사용량이 3배 정도 증가하면, 그리고 처리량에 따라 더 늘 수도 있음을 감안하면 flask 단독 서버에 멀티 프로세스 혹은 멀티 스레드로 request를 요청하는 방식은 고려 대상조차 아닌 것으로 보인다.

## gunicorn & nginx

---

이 시점에서 헷갈리는 지점을 한 번 짚고 넘어가자면, 

요청(requests)을 싱글, MP, MT로 보내는 것과 (이전의 [python] 멀티 프로세스 포스팅 참조)

웹 서버(flask, gunicorn, nginx) 환경을 싱글, 멀티 프로세스(workers), 멀티 스레드로 구성하는 것은 별개라는 것이다. 

웹 서버 환경을 다르게 구성하는 것은 gunicorn 실행시 workers와 threads 옵션을 통해 간단히 수행할 수 있다.

```bash
gunicorn -b 0.0.0.0:<포트> wsgi:app <옵션>
```

flask 단독으로 띄운 것과 비교하기 위해 우선은 workers=1 로 두고 테스트해본다. 

이후 테스트에서 요청(파일) 개수는 100개로 통일한다.

### gunicorn worker 1

파일 개수 100개일 때, flask와 동일하게 request의 MP, MT는 5로 구성한 결과이다.

|file_len|	duration (sec)|	GPU 메모리 사용량 (MiB)|
|----|----|----|
|flask|	29.604961	|3137|
|flask_req_mp5|	19.166628	|4512|
|flask_req_mt5|	19.37616	|4512|
|gunicorn|	29.32597	|3137|
|gunicorn_req_mp5|	28.09986	|3137|
|gunicorn_req_mt5|	27.88324	|3137|
|nginx|	29.39187	|3137|
|nginx_req_mp5|	22.75908	|3137|
|nginx_req_mt5|	22.6108	|3137|

1. 처리 시간

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213791-1d33dcc2-5c32-4870-92e1-f8813f82ae9f.png'></p>

gunicorn 에 직접 요청하는 것은 요청 방식이 어떻든 속도면에서 차이가 없다.

하지만 nginx의 경우 flask에 MP, MT로 요청할 때만큼은 아니지만 약 7초(23%) 정도의 속도 개선이 이뤄졌음을 볼 수 있다.

2. GPU Memory 사용량

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213792-85f89c7b-d2f4-44cf-9a0f-5fc0ba7dcb46.png'></p>

flask 단독 서버와는 달리 gunicorn, nginx 모두 requests 방식에 따른 GPU 메모리 사용량의 변화는 없다. 

1, 2 둘 다 고려를 해보면, flask + gunicorn + nginx 구성이 타당해보인다. 

하지만 개선의 여지는 없을까?

<br/>

### gunicorn worker 2

gunicorn의 worker를 늘리는 것은 멀티 프로세스 개념과도 같이 서버를 worker 수만큼 더 띄우는 것과 다름없다. 

nvidia-smi 로 확인을 할 수 있는데, 아예 웹 서버가 두 개가 띄워졌다. 여기서 바로 해당 방식의 문제점을 파악할 수 있는데, worker를 늘려서 속도를 개선시킬 수 있다하더라도, worker에 비례해 메모리 사용량이 늘어난다는 것이다.

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213793-c94e0771-b742-4039-ab3b-2eb0c860bcda.png'></p>

따라서 채택 불가한 옵션이지만, requests 조건에 따른 처리 시간을 보면 다음과 같다. 

서버 구성은 gunicorn worker 2에 파일 개수는 100개이다. 

|request MP|	gunicorn|	nginx|
|---|---|---|
|1|	30.3229|	28.7468|
|2|	23.5481|	23.2318|
|5|	22.9639|	21.1631|
|10|	23.0195|	21.0489|

그래프에서 flask는 flask 단독 서버에 requests를 싱글로 요청했을 때의 값으로, 가장 기본형과의 비교를 위해 넣었다.

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213794-f8718089-505c-4bd0-98fa-79e1d9ce9a8f.png'></p>

역시나 nginx 쪽의 속도가 가장 빠르다.

<br/>

### gunicorn threads 2

어차피 메모리 문제 때문에 worker를 늘리는 방식은 기각이므로 worker를 더 늘려보지 않고, thread 옵션을 바꿔보기로 한다.

|request MP|	gunicorn_w2|	nginx_w2	|gunicorn_t2|	nginx_t2|
|---|---|---|---|---|
|1|	30.3229|	28.7468|	30.0913|	29.4465|
|2	|23.5481|	23.2318|	21.5853|	21.7639|
|5	|22.9639|	21.1631|	21.1883|	19.3698|
|10	|23.0195|	21.0489|	21.1173|	19.3945|

1. 처리 시간

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213795-e5a519c3-fdca-4944-9181-a2abfa553f2a.png'></p>

앞서 gunicorn 에 worker를 2로 늘린 것과 비교를 해보면, thread를 2로 세팅한 쪽이 훨씬 효율적인 

것을 알 수 있다. 

- worker 2에서 가장 빨랐던 nginx만큼, thread 2 일 때의 gunicorn이 빨라졌다.
- thread 2 일 때의 nginx의 속도가 더 개선되었다.
- request MP를 늘리면 처리 속도가 빨라지다가 어느 지점에선 임계치에 도달한다.

2. GPU 메모리 사용량

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213798-6ca31f0a-e058-4a8b-92b6-a852460dad08.png'></p>

기존 3137MiB에서 3793MiB로 늘어난 것을 볼 수 있다. (참고로 테스트 서버는 /opt/conda/bin/python 을 통해 실행하고 있다.)

하지만 worker도 하나만 띄웠고, 속도 개선을 위해선 충분히 지불할 수 있는 비용이라 여겨진다. 

### gunicorn threads 4, 6, 8, 10

gunicorn과 nginx 를 비교하면 nginx 쪽이 지속적으로 더 낫다는 게 증명되었으니, 이제 gunicorn의 thread 수만 바꿔가며 nginx 테스트만 해보자.

테이블에서 column (ex. t2)는 gunicorn option이 threads 2 라는 의미이다. 

1. 처리 시간

- request 를 MP로
    |request MP	|t2|	t4|	t6|
    |---|---|---|---|
    |1	|29.4465	|29.3292	|30.1410|
    |2	|21.7639	|21.4872	|22.0807|
    |5	|19.3698	|19.0741	|19.7106|
    |10	|19.3945	|18.5791	|18.6749|

- request를 MT로
    |request MT|	t2|	t4|	t6|
    |---|---|---|---|
    |1	|31.1286	|29.6854	|29.8881|
    |2	|22.6746	|21.6944	|21.7618|
    |5	|19.2557	|18.7895	|19.8223|
    |10	|19.1327	|18.5023	|18.0640|


<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213782-69189b3a-ecd6-4702-983a-33400af572f4.png'></p>

파란색이 requests를 MP로, 주황색이 MT로 했을 때의 결과이다. 

multi requests number가 5 이상일 땐, 파란색보다 주황색이 조금 더 빠른 경향을 띄고 있다. 

즉, **server도 스레드로 구성하고, requests도 스레드로 보내는 게 좋다**고 결론을 낼 수 있을 것 같다.  

아무래도 requests 하나당 처리 시간이 있으니, (이론상) 동시에 여러 요청을 보내는 방식(MP)보다, 대기 타임에 다른 작업을 하는 멀티 스레드 방식이 해당 작업엔 더 맞지 않나 생각된다.

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213799-4b00e0e0-2094-4aeb-81ec-6551a3c5b915.png'></p>

전체를 비교해보면, server t6 & req MT10 이 가장 빠르고 그 뒤를 t6_mp10이 아니라 t4_mt10과 t4_mp10 이 따르고 있다. req_MP의 경우 server(gunicorn)의 threads 옵션을 늘린다고 무조건 속도가 빨라지지 않음을 알 수 있다. 

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213800-09c877a9-a6aa-4318-91ac-24db009eb475.png'></p>

그래프로만 판단했을 때, t6의 경우 mt를 좀 더 늘리면 속도 개선의 여지가 있어보이지만, GPU 메모리 사용량도 따져봐야할 시점이다.

2. GPU 메모리 사용량

[GPU 메모리 사용량 - 처리 건수 3000]
|server threads	|req_mp	|req_mt|
|---|---|---|
|t1	|3137	|3137|
|t2	|3981	|3981|
|t4	|4669	|4481|
|t6	|5080	|4824|

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213787-fa3d31d3-9034-45d7-871d-2859078e7d88.png'></p>


GPU 메모리 사용량을 중점적으로 보기 위해 처리 건수를 100에서 3000으로 늘렸다. 

request MT가 MP보다 처리 속도도 빨랐지만, GPU 메모리 사용량도 상대적으로 작다.

## 종합

여태까지의 테스트 결과를 정리하자면

- server 구성은 threads 2 이상
- request 는 멀티 스레드로 5 이상
- 속도와 GPU 메모리 사용량의 trade off 를 고려해 선택할 것.

정도가 되겠다.

최종적으로 처리 시간이 18초 대로 줄어든 조건들을 선별하면 다음과 같다. 

|조건|	처리 시간 (100건)|	GPU 메모리 사용량|	단축 시간|	비율|
|---|---|---|---|---|
|flask_req_single|	29.6049|	3137	|0	|100|
|gunicorn_t4_req_mt5|	18.7895|	4481|	10.8154|	63.47|
|gunicorn_t4_req_mt10|	18.5023|	4481|	11.1026|	62.49|
|gunicorn_t6_req_mt10|	18.064|	4824|	11.5409|	61.02|

<p align="center"><img src='https://user-images.githubusercontent.com/61413986/131213801-c1f8f7f7-85d4-4b4a-b3ab-8cb6524aafca.png'></p>

## 결론

서버 구성과 requests 방식을 multi threads로 변경시, 처리 속도가 기존에 비해 37~39% 가량 절감되었다. GPU 메모리 사용량과의 trade-off 를 감당할 수 있다면 40%까지도 줄일 수 있을 것으로 보이는데 그건 선택의 문제일 것 같다.

무엇보다 모델 개발자가~~조직이~~ 해당 구성의 필요성을 인지하는 게 가장 중요한 게 아닐까 싶다. 배포 이전에 테스트 시간도 줄일 수 있는데 마다할 이유가 있을까 싶지만, 변화를 싫어하는 게 또 사람인지라...