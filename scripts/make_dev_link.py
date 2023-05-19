import os
import sys
import json

def run():
    # check path, must be in root folder
    if not os.path.exists('plugin.json'):
        os.chdir('..')
        if not os.path.exists('plugin.json'):
            print('plugin.json not found, exit')
            return

    # 1. Read plugin_dir
    plugin_dir = ''
    if len(sys.argv) > 1:
        plugin_dir = sys.argv[1]
    while not os.path.exists(plugin_dir):
        plugin_dir = input('Please input the directory of siyuan/data/plugins: ')
        if plugin_dir == 'exit' or plugin_dir == 'quit' or plugin_dir == 'q':
            return
        if not os.path.exists(plugin_dir):
            print('plugin_dir not found!')
            continue

    # 2. Read name in plugin.json
    with open('plugin.json', 'r', encoding='utf-8') as f:
        content = json.load(f)
    name = content.get('name')

    # ...error if name not found
    if not name or name == '':
        print('"name" in plugin.json not found, exit')
        return
        
    dev_dir = os.path.abspath('dev')
    if not os.path.exists(dev_dir):
        os.mkdir(dev_dir)

    # 3. Create symlink
    if not os.path.exists(os.path.join(plugin_dir, name)):
        link = os.path.join(plugin_dir, name)
        os.symlink(dev_dir, link)
        print('Symlink created:', link)
    else:
        print('Folder already exists, exit')
        return

run()
os.system('pause')
