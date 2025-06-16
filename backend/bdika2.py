import os

site = os.path.join(os.environ["VIRTUAL_ENV"], "Lib", "site-packages", "nvidia", "cudnn", "bin")
print("מחפש ב־bin של cudnn:", site)
print(os.listdir(site))
