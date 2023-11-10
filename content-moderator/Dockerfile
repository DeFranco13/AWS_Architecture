FROM public.ecr.aws/lambda/nodejs:18

COPY . .

RUN npm install

# You can overwrite command in `serverless.yml` template
CMD ["app.handler"]
