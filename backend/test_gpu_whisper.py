import torch

if torch.cuda.is_available():
    device = torch.device("cuda:0")
    props = torch.cuda.get_device_properties(device)
    print(f"שם כרטיס: {props.name}")
    print(f"VRAM כולל: {props.total_memory / 1024**3:.2f} GB")
else:
    print("❌ CUDA לא זמין")
