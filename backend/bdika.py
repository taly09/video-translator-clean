import os
import tkinter as tk
from tkinter import filedialog, messagebox

# תיקיית הפרויקט
base_dir = r"C:\Users\X\PycharmProjects\video-translator-restored"

# סיומות חשובות
valid_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.env'}

# תיקיות וספריות שיש לדלג עליהן
excluded_dirs = {'node_modules', '.git', '.venv', '__pycache__', 'venv'}
excluded_partial_path = os.path.join("frontend", "src", "components", "ui")

# שמות ספריות או קבצים שמצביעים על תלות חיצונית
excluded_keywords_in_path = ['site-packages', 'celery']

# איסוף כל הקבצים שרלוונטיים
all_valid_files = []

for root, dirs, files in os.walk(base_dir):
    dirs[:] = [d for d in dirs if d not in excluded_dirs]

    for file in files:
        ext = os.path.splitext(file)[1].lower()
        full_path = os.path.join(root, file)

        if excluded_partial_path in full_path:
            continue

        if any(keyword in full_path for keyword in excluded_keywords_in_path):
            continue

        if ext in valid_extensions:
            all_valid_files.append(full_path)

# GUI לבחירת קבצים
selected_files = []

def export_selected():
    selected = [listbox.get(i) for i in listbox.curselection()]
    if not selected:
        messagebox.showwarning("לא נבחרו קבצים", "בחר לפחות קובץ אחד.")
        return

    output_file = filedialog.asksaveasfilename(defaultextension=".txt", title="בחר היכן לשמור את הפלט",
                                               filetypes=[("Text Files", "*.txt")])
    if not output_file:
        return

    with open(output_file, "w", encoding="utf-8") as out:
        for path in selected:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    code = f.read()
                out.write(f"# {path}\n")
                out.write(code + "\n\n")
            except Exception as e:
                print(f"שגיאה בקריאה: {path}\n{e}")

    messagebox.showinfo("הצלחה", f"הקובץ נוצר בהצלחה:\n{output_file}")
    root.quit()

# יצירת חלון בחירה
root = tk.Tk()
root.title("בחר קבצים שברצונך לכלול בפלט")

listbox = tk.Listbox(root, selectmode=tk.MULTIPLE, width=120, height=30)
for file in all_valid_files:
    listbox.insert(tk.END, file)
listbox.pack(padx=10, pady=10)

export_button = tk.Button(root, text="צור קובץ פלט", command=export_selected)
export_button.pack(pady=10)

root.mainloop()
