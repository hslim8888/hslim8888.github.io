---
layout: posts
title: "[python] 멀티 프로세스로 작업 속도 향상시키기" 
categories:
  - programming
tags:
  - python, 멀티프로세스, multi, 속도
use_math: true
comments: true
---
  
# 병목 구간 찾기

입사 후 첫 프로젝트가 데이터 전처리였다. 주어진 당면 과제가 가능한 모든 파트에 멀티 프로세스를 적용하고 전처리 시간을 최대한 줄이라, 그래야 뒷작업까지 하루 안에 끝낼 수 있다.. 라는 것.

전처리에서 시간을 많이 잡아 먹는 부분을 찾아보니 주로 list나 dictionary에 담긴 자료들을 처리하는 작업이었는데 죄다 list에 담긴 자료를 처리하거나, 반복문인 구간이었다. 

하다보니 앞서 언급한 거의 모든 병목 구간에서 멀티 프로세스로 구성하는 법을 터득하게 되었고, 싱글로 처리할 경우 하루가 훌쩍 넘어가도 끝내지 못하던 작업을(결국 끝을 못 봄), 멀티로 구성해 1시간 이내로 끝내기도 했었다.

멀티 프로세스를 소개하는 자료를 찾아보면 주로 아래의 기본형 구성만 소개하고 끝인데, 여기선 요소별/범위형 프로세싱에 더해 return 값을 받아서 처리하는 것까지 정리하려고 한다.


# 기본형
Python 멀티프로세스엔 여러 라이브러리가 있지만, 대체로 추천하는 건 ProcessPoolExecutor 라 그걸 썼는데, 기본형은 아래와 같다.

참고로 ProcessPoolExecutor 대신 ThreadPoolExecutor 을 쓰면 멀티 스레드로 간단하게 변경할 수 있다.

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

n_cpu = multiprocessing.cpu_count()   
# 아래와 같은 방식으로 cpu 사용률 조절 가능.
# n_cpu = int(multiprocessing.cpu_count() * 0.7)  

def function_single(var1, var2):
    print(var1 + var2)

def function_multi():
		list_of_var1 = [1, 3, 5]
		list_of_var2 = [2, 4, 6]
    with ProcessPoolExecutor(max_workers=n_cpu) as executor:
        executor.map(function_single, list_of_var1, list_of_var2)

if __name__ == "__main__":
	  function_multi()
```

executor.map이 묶어주는 건, 멀티로 처리하려는 싱글 함수와 싱글 함수의 인자들이다.

list_of_var1, list_of_var2와 같이 executor.map의 인자에서, 함수가 아닌 부분은, length가 동일한 list로 구성해야 한다. 리스트의 같은 index 를 인자로 택해, 각각의 멀티가 돌아가는 식이기 때문이다.

예시의 경우 출력값은 아래와 같다.
```
list_of_var1[0] + list_of_var2[0] = 3
list_of_var1[1] + list_of_var2[1] = 7
list_of_var1[2] + list_of_var2[2] = 11
```
function_single 이 처리되는 속도에 따라 출력 순서가 달라질 수 있다는 점은 유념해야 한다. 즉, return 값을 받아올 때 리스트에 그냥 담으면 안 된다는 이야기.

리스트를 멀티로 처리하는 경우는 작업 방식에 따라 크게 두 가지로 나눌 수 있다. 그리고 그 두 가지 방식과 추가로 말하는 방식을 상황에 맞게 사용한다면, 리스트로 구성할 수 있는 건 웬만하면 멀티로 다 처리할 수 있으리라 생각한다.
  


# 요소별 프로세싱

첫 번째는 리스트의 요소를 하나씩 처리하는 건데, 위의 기본형에서 든 예와 동일한 방식이다.

전처리에서는 이 방식을 주로 텍스트 파일을 읽어와 tfrecord라는 형식의 output을 만들 때 사용했는데, tfrecord 만드는 데 걸리는 시간도 오래 걸렸을 뿐더러, 처리할 파일의 개수도 아주 많아서 꼭 멀티로 구성해야하는 부분이었다.

예시는 txt 파일을 처리해 json으로 바꿔 저장하는 작업이다.

```python
input_file_list = ['file1.txt', 'file2.txt', 'file3.txt']
output_file_list = ['file1.json', 'file2.json', 'file3.json']
some_factor = 0.5   # 임의의 값

def convert_txt_json_single(input_file, output_file, some_factor):
    with open(input_file, 'r') as f:
        text = json.load(f)
		~~~~
    with open(output_file, 'w') as f:
        json.dump(text, f)

def convert_txt_json_multi():
    n_files = len(input_file_list)
	with ProcessPoolExecutor(max_workers=n_cpu) as executor:
        executor.map(convert_txt_json_single, 
                     input_file_list,
                     output_file_list,
					 [some_factor] * n_files)
```

func_single에 쓰이는 some_factor의 경우 리스트가 아니여서 멀티프로세싱의 인풋엔 [some_factor] * n_files 로 변환해 넣어야 한다.
  


# 범위 프로세싱

리스트의 개별 요소 처리엔 시간이 많이 걸리지 않는데, 리스트가 길어서 병목이 되는 경우도 많다. 그 경우 리스트를 일정한 간격으로 쪼개서 처리하면 되는데, 요소별 처리보다는 조금 까다롭다.

기본은 single로 돌리는 함수에 처리하려는 리스트의 인덱스를 인자로 넣어주는 것이다.

아래의 예는 dict의 key를 리스트로 만들어 dict 파일을 쪼갠 뒤, 멀티로 처리하는 방식.

```python
def func_single(start, end):
	for key in ccid_list[start, end]:
		for token_sent in total_json[key]['tokenized_sentence']:
			# 어쩌고 저쩌고

def func_multi():
	global total_json, ccid_list
	total_json = some_function(summary)
	ccid_list = list(total_json.keys())
	ccid_list.sort()

	# 범위 쪼개기
	full_len = len(ccid_list)
    process_index = int(full_len / n_cpu)
    rng_list = [(i + 1) * process_index for i in range(n_cpu)]
    if rng_list[0] != 0:
        rng_list.insert(0, 0)
    if rng_list[-1] < full_len:
        rng_list.append(full_len)

		with ProcessPoolExecutor(max_workers = n_cpu) as executor:
				executor.map(func_single,
				             rng_list[0:-1], 
							 rng_list[1:]
				             )
```

범위 쪼개는 부분은 코드만 보면 쉽게 이해할 수 있을 거라 설명은 생략한다.

여기서 핵심은 global 파트이다.

요소별 프로세싱보다 까다로운 이유는 범위를 쪼개는 데 있는 게 아니고, list를 인풋으로 받는 요소별 프로세싱과는 달리, func_single 내에 처리하려는 list가 들어있다는 점이다. 해당 리스트나 변수를 single의 인풋으로 받게 되면, executor.map의 인자가 아래와 같은 식이 되는데, 무척 비효율적이다.

```python
ccid_list = [1, ...., 9999999999]

...
n_files = len(rng_list[0:-1])
executor.map(func_single,
			rng_list[0:-1], 
			rng_list[1:],
			[ccid_list] * n_files   ##
			)
## [ [1, ...., 9999999999], [1, ...., 9999999999], ... , [1, ...., 9999999999] ]
```

이를 해결하기 위해 해당 리스트를 init으로 self.ccid_list로 만들어보기도 하고 별짓을 다 해봤는데, 케이스별로 될 때도 있고, 안 될 때도 있었다.

그 차이를 정확히 구별하지 못해 시행착오를 엄~~~~청나게 겪었는데 결국 single에 들어가는 리스트를 **전역 변수로 선언**하면 매끈하게 작동하는 걸 알아냈다. 



# Return 값 처리

위의 방식은 모두 return 값이 없다.

멀티프로세싱으로 리턴값을 받아 처리하려면 executor를 리스트로 묶어주면 된다.

주의할 점은 각각의 멀티프로세싱이 시작한 순서대로 완료가 되는 건 아닐 수 있기에, 리스트에 결과값을 담되 순서는 무시할 수 있는 요소로 만들어야 한다. 

그래서 각 프로세싱의 결과를 dict 형태로 return 받고, 필요한 경우 리스트 안의 dict를 하나로 합치는 방식으로 사용했다.

아래의 예는 멀티로 여러 문서를 토크나이징해 각 토큰의 빈도수를 저장한 뒤 하나로 합치는 경우이다.

```python
def count_vocab(input_file):
    with open(input_file, 'r') as f:
        lines = f.readlines()
	def _tokenize(sent):
		split_tokens = tokenizer.tokenize(sent)
		split_tokens = [token.strip() for token in split_tokens]
		return split_tokens
	vocab_count = Counter(sub for line in lines for sub in 					_tokenize(line))
    return vocab_count

def count_vocab_multi(input_file_list):
	counter = Counter()
	with ProcessPoolExecutor(max_workers=n_cpu) as executor:
		vocab_count_list = list(executor.map(count_vocab, 									input_file_list))
	# 결과를 하나의 counter에 담기 - dict와 비슷한 구조.
	for vocab_count in vocab_count_list:
		counter.update(vocab_count)
	# dict로 변환
	total_count = dict(counter)
	return total_count
```

빈도수를 세고 병합해야 했기에 Counter를 썼는데 dict 구조나 마찬가지라고 생각해도 무방할 것이다.

