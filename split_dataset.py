import os
import shutil
import random

# Set these paths based on where your images are stored
SOURCE_DIR_OPEN = r'C:\Users\Suyash\Downloads\datasetDDD\Open_Eyes'
SOURCE_DIR_CLOSED = r'C:\Users\Suyash\Downloads\datasetDDD\Closed_Eyes'
DEST_DIR = 'dataset'  # Output directory

def split_and_copy(class_name, src_folder):
    images = os.listdir(src_folder)
    random.shuffle(images)
    
    train_split = int(0.8 * len(images))
    train_images = images[:train_split]
    test_images = images[train_split:]
    
    for img in train_images:
        dest_path = os.path.join(DEST_DIR, 'train', class_name)
        os.makedirs(dest_path, exist_ok=True)
        shutil.copy(os.path.join(src_folder, img), os.path.join(dest_path, img))
    
    for img in test_images:
        dest_path = os.path.join(DEST_DIR, 'test', class_name)
        os.makedirs(dest_path, exist_ok=True)
        shutil.copy(os.path.join(src_folder, img), os.path.join(dest_path, img))

split_and_copy('Open', SOURCE_DIR_OPEN)
split_and_copy('Closed', SOURCE_DIR_CLOSED)

print("✅ Dataset split complete!")
