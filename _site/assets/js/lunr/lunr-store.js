var store = [{
        "title": "One Hot Encoding",
        "excerpt":"Multi Classification 변이 유전자 탐색 및 분류 머신러닝과 딥러닝 이론을 어느정도 공부하고 진짜 문제와 이론을 접목시켜보기 위해 캐글 같은 프로젝트에 도전해보고 있다. 현재는 캐글에서 변이 유전자 탐색 프로젝트에 도전하고 있는데, 결국 1~9까지의 Mulit classification 유형이다. 문제는 feature가 Gene, Variation(변이), Text로 전부 categorical이라는 것. Text feature의 경우 길이도 엄청 길어서, NPL에...","categories": ["datascience"],
        "tags": ["Blog, classification, categorical, 범주형, NLP"],
        "url": "/datascience/One-Hot-Encoding/",
        "teaser": null
      },{
        "title": "Response Coding",
        "excerpt":"범주형 데이터 Response Coding One-hot-encoding에 이어서 Response Coding은 조건부 확률을 일컫는 것이나 다름없다. 참조 수식은 다음과 같은데 $P(class=X \\vert category=A) = P(category=A \\cap class=X) / P(category=A)$ category에 따른 class의 확률을 구하는 것이라, Category의 개수만큼 차원(feature)이 생기는 원핫인코딩과는 달리 Response Coding은 class의 개수만큼 차원(feature)이 늘어난다. 또한 클래스당 확률을 고려하는 거라 모델의...","categories": ["datascience"],
        "tags": ["classification"],
        "url": "/datascience/responce-coding/",
        "teaser": null
      },{
        "title": "[python] 멀티 프로세스로 작업 속도 향상시키기",
        "excerpt":"병목 구간 찾기 입사 후 첫 프로젝트가 데이터 전처리였다. 주어진 당면 과제가 가능한 모든 파트에 멀티 프로세스를 적용하고 전처리 시간을 최대한 줄이라, 그래야 뒷작업까지 하루 안에 끝낼 수 있다.. 라는 것. 전처리에서 시간을 많이 잡아 먹는 부분을 찾아보니 주로 list나 dictionary에 담긴 자료들을 처리하는 작업이었는데 죄다 list에 담긴 자료를 처리하거나,...","categories": ["programming"],
        "tags": ["python, 멀티프로세스, multi, 속도"],
        "url": "/programming/multi-process-in-python/",
        "teaser": null
      },{
        "title": "딥러닝 requests 속도 개선하기",
        "excerpt":"다른 관점으로 보기 데이터 분석 및 모델링 공부를 하다가 관련 직무에 지원했지만, 입사 후엔 어플리케이션 개발 팀에 배속되었고 거기서 맡은 업무는 데이터 전처리였다. 스스로 생각하기에 꽤나 특이한 경로를 거치는 중인데 덕분에 데이터 엔지니어링 뿐 아니라 그 전엔 전혀 알지 못했던 웹 개발까지 얕게나마 두루두루 살펴 볼 수 있는 기회를 갖게...","categories": ["datascience"],
        "tags": ["deeplearning","requests","http","web_server","속도","개선"],
        "url": "/datascience/increase-requests-speed-DL/",
        "teaser": null
      },{
        "title": "딥러닝 requests 속도 개선하기 - 1) web server 환경 구성",
        "excerpt":"본 포스팅에선 도커를 이용하여 웹 서버를 flask, gunicorn, nginx 조합으로 구성하는 방법을 정리한다. docker 이미지 도커 이미지는 flask와 gunicorn 이 같이 설치된 것과, nginx 가 설치된 것 두 개를 만들어 준다. 하나를 만들어서 컨테이너를 두 개 따로 띄워도 되는데, 개별로 만들면 docker-compose로 한 번에 올리기가 편하다. 1. flask &amp; gunicorn...","categories": ["datascience"],
        "tags": ["deeplearning","requests","http","web_server","속도","개선","docker","개발환경"],
        "url": "/datascience/web-server-env-setting/",
        "teaser": null
      },{
        "title": "딥러닝 requests 속도 개선하기 - 2) 테스트 결과",
        "excerpt":"requests 테스트 조건 테스트는 다음과 같은 조건으로 한다. (MP==멀티 프로세스, MT==멀티 스레드) 서버 구성 : single, MP, MT requests 방식 : single, MP, MT 서버 구성은 gunicorn 실행 시 option을 달리하며 구현할 수 있고, request 방식은 이전의 포스트([python] 멀티 프로세스)에 정리한 것을 참조하여 구현할 수 있다. 테스트 하기 전엔 응답...","categories": ["datascience"],
        "tags": ["deeplearning","requests","http","web_server","속도","개선"],
        "url": "/datascience/test-results/",
        "teaser": null
      }]
