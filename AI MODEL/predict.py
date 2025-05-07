from ultralytics import YOLO
import pandas as pd
import os
import json

model = YOLO("C:\\Users\\aryan\\Indavian app\\yolo model\\yolov8-seg\\best weights\\best.pt")
# image_dir = "C:\\Users\\aryan\\Indavian app\\yolo model\\yolov11-seg\\test-data (rotated)"
image_dir = "C:\\Users\\aryan\\Indavian app\\project3-survey2"

def detect(images):
    
    # detection_count = 0
    result_json = []
    results = model.predict(source=images, retina_masks=True, save=True, iou=0.15, show_conf=False, imgsz=640, agnostic_nms=True)
    
    for idx, result in enumerate(results):
        # image_name = result.path.split('\\')[-1]
        result_json.append(result.to_json())
        # result.save_txt(txt_file=f'{image_name}.txt')
        # detection_count += len(result.masks)
    
    data =  [json.loads(json_str) for json_str in result_json]
    with open('output-4.txt', 'w') as file:
        json.dump(data, file, indent=4)
    # print('Number of defects detected:', detection_count)

detect(image_dir)