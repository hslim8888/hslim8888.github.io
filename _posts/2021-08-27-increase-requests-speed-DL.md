---
layout: posts
title: "딥러닝 requests 속도 개선하기 - 0) 들어가며" 
excerpt: "웹 서버 구성을 바꿔 딥러닝 처리 속도를 개선해보자."
categories:
  - datascience
tags:
  - [deeplearning, requests, http, web_server, 속도, 개선]
use_math: true
comments: true
---

# 다른 관점으로 보기

데이터 분석 및 모델링 공부를 하다가 관련 직무에 지원했지만, 입사 후엔 어플리케이션 개발 팀에 배속되었고 거기서 맡은 업무는 데이터 전처리였다. 

스스로 생각하기에 꽤나 특이한 경로를 거치는 중인데 덕분에 데이터 엔지니어링 뿐 아니라 그 전엔 전혀 알지 못했던 웹 개발까지 얕게나마 두루두루 살펴 볼 수 있는 기회를 갖게 되었다. 또한 대량의 데이터를 전처리해야했던터라 프로세스 효율성을 늘 염두에 두는 관점도(만 without 실력) 자연스레 기를 수 있었다.

그래서인지 flask 서버를 띄우고 api를 순차적으로 찔러서 모델의 결과값을 받는, 그래픽 카드를 늘리는 수직적 scale up만 고려할 수 밖에 없는, ~~회사의~~ 일반적인 딥러닝 배포 방식에 의문이 들었다. 

딥러닝 모델이 뒷단에서 느긋하게(?) 돌아가는 게 아니라, 사용자가 모델을 실시간으로 찔러 응답을 주고받는 B2C 방식도 어딘가엔 있을텐데, request를 단일로 주고 받는 건 너무나도 비효율적이지 않은가?

이런 문제의식을 몇몇 딥러닝 개발자에게 재기를 해봤지만, 대부분 '그게 뭐 어때서?'라는 반응이었다. 서비스단까지 고려하는 훈련이 안 되어 있기 때문은 아닐까? 아마 나 역시 데이터 분석이나 모델링만 했다면 그들과 같은 반응을 보였으리라 생각한다.

각설하고, 찾아보니 역시 방법은 있었다.

바로 production 레벨의 웹 서버 배포에 일반적으로(?) 쓰이는 flask + gunicorn + nginx  조합. 

<p align="center"><img src="https://user-images.githubusercontent.com/61413986/131207543-47d45351-f27a-4b55-8ea9-78540a2ec6de.png"></p>
출처 : [https://villoro.com/post/nginx_gunicorn](https://villoro.com/post/nginx_gunicorn)

web server, wsgi에 대한 이론적인 부분은 이 [페이지](https://wikidocs.net/75556)에 간단하게 잘 설명되어 있다. 

해당 시리즈에선 서버 환경 구성과 각 환경에 따른 응답 처리 속도 비교를 주로 다루려고 한다.

그 전에 결과부터 말하자면, <U>GPU 메모리 사용량</U>의 큰 증가 없이

100개의 requests 처리시 약 <U>29초에서 18초대로 기존 대비 37% 이상</U> 처리 속도를 줄일 수 있었다. 

<p align="center"><img src="https://user-images.githubusercontent.com/61413986/131207541-62921987-e0a4-4cd4-8a03-32c14c8d1585.png"></p>
