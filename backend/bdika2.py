import os
import tkinter as tk
from tkinter import filedialog, messagebox

# אפשרות א': ברירת מחדל - נתיב הסקריפט עצמו
default_base_dir = os.path.dirname(os.path.abspath(__file__))

# פופאפ לבחירת תיקייה (אפשר לדלג ע"י Cancel)
root = tk.Tk()
root.withdraw()  # הסתרת חלון ראשי
base_dir = filedialog.askdirectory(title="בחר תיקיית בסיס (או לחץ Cancel כדי להשתמש בברירת מחדל)")

if not base_dir:
    base_dir = default_base_dir
    messagebox.showinfo("שימוש בברירת מחדל", f"לא נבחרה תיקייה - נעשה שימוש בתיקיית הסקריפט:\n{base_dir}")

# הגדרות סינון
valid_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.env'}
excluded_dirs = {'node_modules', '.git', '.venv', '__pycache__', 'venv'}
excluded_partial_path = os.path.join("frontend", "src", "components", "ui")
excluded_keywords_in_path = ['site-packages', 'celery']

# איסוף קבצים
all_valid_files = []

for root_dir, dirs, files in os.walk(base_dir):
    dirs[:] = [d for d in dirs if d not in excluded_dirs]

    for file in files:
        ext = os.path.splitext(file)[1].lower()
        full_path = os.path.join(root_dir, file)

        if excluded_partial_path in full_path:
            continue
        if any(keyword in full_path for keyword in excluded_keywords_in_path):
            continue
        if ext in valid_extensions:
            all_valid_files.append(full_path)

# GUI לבחירת קבצים
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
    window.quit()

# פתיחת חלון בחירה
window = tk.Tk()
window.title("בחר קבצים שברצונך לכלול בפלט")

listbox = tk.Listbox(window, selectmode=tk.MULTIPLE, width=120, height=30)
for file in all_valid_files:
    listbox.insert(tk.END, file)
listbox.pack(padx=10, pady=10)

export_button = tk.Button(window, text="צור קובץ פלט", command=export_selected)
export_button.pack(pady=10)

window.mainloop()
