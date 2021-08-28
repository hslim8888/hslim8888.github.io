---
layout: posts
title: "딥러닝 requests 속도 개선하기 - 1) web server 환경 구성"
excerpt: "도커로 flask, gunicorn, nginx 서버 띄우기"

categories:
  - data-science
tags:
  - [deeplearning, requests, http, web_server, 속도, 개선, docker, 개발환경]
toc: true
toc_sticky: true
use_math: true
comments: true
---
본 포스팅에선 도커를 이용하여 웹 서버를 flask, gunicorn, nginx 조합으로 구성하는 방법을 정리한다.

## docker 이미지

도커 이미지는 flask와 gunicorn 이 같이 설치된 것과, nginx 가 설치된 것 두 개를 만들어 준다. 

하나를 만들어서 컨테이너를 두 개 따로 띄워도 되는데, 개별로 만들면 docker-compose로 한 번에 올리기가 편하다. 

### 1. flask & gunicorn 용 

아래에도 설명하겠지만, 구동 측면에서 gunicorn은 flask를 대신 실행시켜주는 거라 생각하면 된다.

그래서 flask와 gunicorn은 같은 곳에 설치해야 한다.

    ```
    // Dockerfile 추가
    RUN pip install flask==1.1.2 flask_cors==3.0.9
    RUN pip install flask_restful_swagger_2==0.35
    RUN pip install gunicorn
    ```

### 2. nginx 용

nginx.conf와 project.conf 파일은 nginx 용 Dockerfile 과 같은 경로에 생성해준다. 

nginx 설정은 필요에 따라 변경 가능.

```
// Dockerfile - nginx
FROM nginx:1.15.8

RUN rm /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/
RUN rm /etc/nginx/conf.d/default.conf
COPY project.conf /etc/nginx/conf.d/

RUN apt-get update
RUN apt-get install -y net-tools
RUN apt-get install vim
```

```
// nginx.conf
# Define the user that will own and run the Nginx server
user  nginx;
# Define the number of worker processes; recommended value is the number of
# cores that are being used by your server
worker_processes  1;
# Define the location on the file system of the error log, plus the minimum
# severity to log messages for
error_log  /var/log/nginx/error.log warn;
# Define the file that will store the process ID of the main NGINX process
pid        /var/run/nginx.pid;

# events block defines the parameters that affect connection processing.
events {
    # Define the maximum number of simultaneous connections that can be opened by a worker proce$
    worker_connections  1024;
}

# http block defines the parameters for how NGINX should handle HTTP web traffic
http {
    # Include the file defining the list of file types that are supported by NGINX
    include       /etc/nginx/mime.types;
    # Define the default file type that is returned to the user
    default_type  text/html;
    # Define the format of log messages.
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for"';
                            # Define the location of the log of access attempts to NGINX
    access_log  /var/log/nginx/access.log  main;
    # Define the parameters to optimize the delivery of static content
    sendfile        on;
    tcp_nopush     on;
    tcp_nodelay    on;
    # Define the timeout value for keep-alive connections with the client
    keepalive_timeout  65;
    # Define the usage of the gzip compression algorithm to reduce the amount of data to transmit
    #gzip  on;
    # Include additional parameters for virtual host(s)/server(s)
    include /etc/nginx/conf.d/*.conf;
}
```

```
// project.conf
server {

    listen 80;
    server_name 서버 이름;
    client_max_body_size 20M;   -- 디폴트가 10M가 어지간하면 늘려주는 게 좋다. 

    location / {
        proxy_pass http://<flask 서버 경로>:<포트>;  -- 소켓이 더 빠르다고.

        # Do not change this
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static {
        rewrite ^/static(.*) /$1 break;
        root /static;
    }
}
```

## flask 서버

```
// flask.py
from flask import Flask

app = Flask(__name__)

@app.route('/hello')
def hello():
    return 'Hellow World!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port='8080')
```

위와 같은 flask 서버를 단일로 띄우려면 아래와 같이 실행하면 된다.

```
python flask.py
```

## gunicorn

flask.py와 같은 경로에 wsgi.py을 다음과 같이 생성한다.

```
// wsgi.py 
from flask import app

if __name__ == "__main__":
    app.run()
```

이후 flask.py와 같은 경로에서 gunicorn을 다음과 같이 실행시킨다.

```
gunicorn -b 0.0.0.0:<포트> wsgi:app <옵션>
```

gunicorn 실행 옵션엔 —workers 5 —threads 10 같은 것을 넣을 수 있는데, 이후 옵션을 달리해 처리 속도 테스트를 할 예정이다.

소스를 보면 flask app을 gunicorn을 통해 실행시키 것과 다름없음을 알 수 있다.

참고로 -b는 bind인데 이 [페이지](https://wikidocs.net/76904)를 보면 소켓에 bind 하면 포트 통신보다 더 빠르고 효율적이라고 한다. 하지만 docker 컨테이너 환경에서 소켓을 연결하는 법을 몰라 여기서는 포트 연결로만 진행하겠다.

## nginx

컨테이너를 띄우면서 실행해도 되지만, 여러 테스트를 해야해서 컨테이너 내부에서 nginx 서버를 띄우기로 한다. 

```
// nginx 구동
service nginx start
// 재구동 
service nginx restart
// 서버 확인
netstat -ntlp
```

다음 포스팅에선, 이렇게 띄운 flask&gunicorn + nginx 환경에서 싱글, 멀티 프로세스, 멀티 스레드 방식으로 request를 날려보며 처리 시간을 비교한 결과를 다루려고 한다.