---
layout: posts
title: "One Hot Encoding" 
categories:
  - datascience
tags:
  - Blog, classification, categorical, 범주형, NLP
use_math: true
comments: true
---

# Multi Classification
## 변이 유전자 탐색 및 분류

머신러닝과 딥러닝 이론을 어느정도 공부하고 진짜 문제와 이론을 접목시켜보기 위해 캐글 같은 프로젝트에 도전해보고 있다.

현재는 캐글에서 [변이 유전자 탐색](https://www.kaggle.com/c/msk-redefining-cancer-treatment/data) 프로젝트에 도전하고 있는데, 결국 1~9까지의 Mulit classification 유형이다.

문제는 feature가 Gene, Variation(변이), Text로 전부 categorical이라는 것. Text feature의 경우 길이도 엄청 길어서, NPL에 대한 이해도 필요할 것 같다.

그건 나중에 보기로 하고 우선 Gene과 Variation을 처리하자면, Gene의 nunique는 264, Variation은 2996으로 One-hot-Encoding으로 처리하면 컬럼이 너무 많아진다.

## Evaluation Metrics

또 한 가지 주의점은 Evaluation Metrics가 [Log Loss](http://wiki.fast.ai/index.php/Log_Loss)란 것. 이진 분류인 경우 수직은 다음과 같은데

$-(y\log(p)+(1-y)\log(1-p))$

class 뿐 아니라 확률까지 고려하는 방식이다. 클래스를 정확히 분류했더라도, 다른(틀린) 클래스에도 확률을 부여했다면(그래서 정답 확률이 낮아졌다면) 거기에 패널티를 부여하는 방식으로 작동한다. 범위는 0~무한대이고 당연히 낮을수록 좋은데, good bad 기준이 명확하지 않다. 따라서 랜덤모델(worst case)을 만들고 거기에서 시작하는 게 좋은 방법.

Metric이 Log loss라 모델이 도출하는 건 각 클래스의 확률이어야 한다.

## Handling categorical features
### One Hot Encoding

범주형 데이터(특히 문자형)는 보통 One-Hot-Encoding을 하는데 이것도 여러 방식이 있다.

```python
# 1) pandas
pd.get_dummies(df['Gene'])

# 2) OneHotEncoder
from sklearn.preprocessing import OneHotEncoder
enc = OneHotEncoder()
enc.fit_transform(np.array(df['Gene'].reshape(-1,1))

# 3) CountVectorizer
from sklearn.feature_extraction.text import CountVectorizer
enc = CountVectorizer()
enc.fit_transform(df['Gene'])
```

Pandas를 이용한 1번이 가장 편하긴한데, 아래와 같이 DataFrame을 생성해 메모리 소모가 있다.
```python
	ABL1	ACVR1	AGO2	AKT1	AKT2	AKT3	ALK	APC	AR	ARAF	...	TSC1	TSC2	U2AF1	VEGFA	VHL	WHSC1	WHSC1L1	XPO1	XRCC2	YAP1
1019	0	0	0	0	0	0	0	0	0	0	...	0	1	0	0	0	0	0	0	0	0
676	0	0	0	0	0	0	0	0	0	0	...	0	0	0	0	0	0	0	0	0	0
243	0	0	0	0	0	0	0	0	0	0	...	0	0	0	0	0	0	0	0	0	0
901	0	0	0	0	0	0	0	0	0	0	...	0	0	0	0	0	0	0	0	0	0
```

반면, 2),3)은 generator(맞나?)로 필요할 때 사용하기 때문에 메모리 사용은 덜하다.
```python
<2124x235 sparse matrix of type '<class 'numpy.int64'>'
	with 2124 stored elements in Compressed Sparse Row format>
```

이 프로젝트를 공부하면서 3번 방법을 처음 알게 되었는데, array화시키고, reshape도 신경써줘야하는 2번에 비해 편하다.

## Response Coding

One hot encoding의 단점은 category에 nunique가 많을 경우 생성되는 컬럼이 너무 많다는 것. 해당 프로젝트의 Metric이 각 클래스의 확률을 고려하는 Log Loss란 점을 고려해 Response Coding을 이용하는 게 좋아보이는데 Response Coding에 대해선 다음 글에 다루겠다.


