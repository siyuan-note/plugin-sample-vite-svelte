import os
import json
from argparse import ArgumentParser

# 1. Read plugin_dir
parser = ArgumentParser()
parser.add_argument('plugin_dir')
args = parser.parse_args()
plugin_dir = args.plugin_dir

# 2. Read name in plugin.json
with open('plugin.json', 'r', encoding='utf-8') as f:
    content = json.load(f)
name = content.get('name')

# ...error if name not found
if not name or name == '':
    print('"name" in plugin.json not found, exit')
    exit()
    
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
    exit()
