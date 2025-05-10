FROM node:lts-slim
COPY . /app
ENV PORT 80
EXPOSE 80
ENV NODE_ENV production
WORKDIR "/app"
CMD ["npm", "run", "serve:prod"]

