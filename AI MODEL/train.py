import comet_ml
from ultralytics import YOLO
import os

os.environ["COMET_API_KEY"] = "DJ5r6fYsh0Q4vqDAcvdgQJumK"

# Load the model.
comet_ml.login()
# model = YOLO('C:\\Users\\aryan\\Indavian app\\yolo model\\yolov8-seg\\3rd - best weights\\best.pt')
model = YOLO("C:\\Users\\aryan\\Indavian app\\yolo model\\yolov8-seg\\yolov8n_new\\train\\weights\\best.pt")

 
# Training.
results = model.train(
   data='data.yaml',
   imgsz=640,
   epochs=100,
   # verbose=True,
   batch=32,
   plots=True,
   seed=123,
   degrees=90,
   flipud=1,
   patience=45,
   resume=True,
   project='yolov8n_new',
   )