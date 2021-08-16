---
layout: posts
title: "Response Coding" 
categories:
  - classification
tags:
  - Blog
use_math: true
comments: true
---

# 범주형 데이터
## Response Coding
[One-hot-encoding에 이어서](https://hslim8888.github.io/classification/One-Hot-Encoding/)

Response Coding은 조건부 확률을 일컫는 것이나 다름없다. [참조](https://medium.com/@thewingedwolf.winterfell/response-coding-for-categorical-data-7bb8916c6dc1)


수식은 다음과 같은데

$P(class=X \vert category=A) = P(category=A \cap class=X) / P(category=A)$

category에 따른 class의 확률을 구하는 것이라, Category의 개수만큼 차원(feature)이 생기는 원핫인코딩과는 달리 Response Coding은 ***class의 개수만큼*** 차원(feature)이 늘어난다.

또한 클래스당 확률을 고려하는 거라 모델의 측정 지표인 Log loss와도 궁합이 맞는 것 같다.

찾아보니 One hot encoding은 Logistic Regression, SVM에 쓰면 좋고, Response Coding은 나이브 베이즈 모델, KNN, 랜덤 포레스트 모델에 쓰면 좋다고 하는데 실제 그런지는 기회가 되면 테스트 해봐야겠다. 


## Laplace Smoothing (Additive Smoothing)

머신러닝에 조건부 확률을 쓸 때의 문제는 train, test set을 나눈다는 점이다.

class가 0,1,2 세 개이고 train의 카테고리가 A, B, C, D, E가 있을 때, $P(class=1 \vert category=A)$를 구할 수 있다.

하지만 Test set에선 카테고리가 A,B,C,D,E,F로 train set에 없던 F가 더 있을 수 있으며, 이 경우 훈련 모델에선 P(F)=0라 위 수식에선 분모가 0이 되거나 

![](https://wikimedia.org/api/rest_v1/media/math/render/svg/1386ec6778f1816c3fa6e9de68f89cee2e938066)

[Chain Rule](https://en.wikipedia.org/wiki/Chain_rule_(probability)) 에선 값이 무조건 0이 되어버린다.

이런 문제를 간단히 해소하는 것이 바로 Laplace Smoothing(라플라스 평활)이다. [위키](https://en.wikipedia.org/wiki/Additive_smoothing)

$p_i = x_i/N$ 에서  
$p_i = (x_i+alpha)/(N+alpha*K)$ 로 바꿔준 건데, K는 class의 개수이다.

위의 예에서 N=100, alpha=1이라 했을 때, 

원래라면 $P(F \vert 1)=0/100$ 이지만, 
라플라스 평활을 이용하면 $P(F \vert 1)=(0+1)/(1000+3)$ 으로 값이 0이 아니게 된다.

따라서 머신러닝 문제에서 조건부 확률을 이용할 땐 무조건 Laplace Smoothing을 고려해야한다고 생각하면 될 듯.
