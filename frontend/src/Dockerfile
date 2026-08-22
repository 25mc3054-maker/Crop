FROM python:3.9-slim
RUN pip install boto3
COPY process_satellite.py /app/process_satellite.py
WORKDIR /app
CMD ["python", "process_satellite.py"]