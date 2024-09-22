FROM node:20

ENV TIME_ZONE=Asia/Shanghai
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY . /app/
RUN yarn install && yarn build 


EXPOSE 3004
CMD ["yarn", "start:prod"]
