.venv/Script/activate
pyinstaller --noconfirm --onefile --console  "./make_dev_link.py"
rm ./make_dev_link.exe
mv ./dist/make_dev_link.exe .
