import os
import tkinter as tk
from tkinter import filedialog

# יצירת חלון (בלי להציג אותו בפועל)
root = tk.Tk()
root.withdraw()

# פתיחת דיאלוג לבחירת תיקיה
folder_path = filedialog.askdirectory(title="בחר תיקיה")

if folder_path:
    # קבלת שמות התיקיות בלבד
    folders = [name for name in os.listdir(folder_path)
               if os.path.isdir(os.path.join(folder_path, name))]

    print("שמות התיקיות שנמצאו:")
    for folder in folders:
        print(folder)
else:
    print("לא נבחרה תיקיה.")
