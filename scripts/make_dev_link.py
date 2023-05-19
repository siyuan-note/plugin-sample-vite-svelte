import os
import json
from argparse import ArgumentParser

# 1. 读取一个参数 plugin_dir
parser = ArgumentParser()
parser.add_argument('plugin_dir')
args = parser.parse_args()
plugin_dir = args.plugin_dir

# 2. 读取当前根目录下 plugin.json 的 name 字段
with open('plugin.json', 'r', encoding='utf-8') as f:
    content = json.load(f)
name = content.get('name')

# ...如果 name 字段为空，报错并退出
if not name or name == '':
    print('"name" in plugin.json not found, exit')
    exit()
    
dev_dir = os.path.abspath('dev')
if not os.path.exists(dev_dir):
    os.mkdir(dev_dir)

# 3. 读取 plugin_dir 下的是否有和 name 字段相同的文件夹
# ...如果没有，创建一个软链接到当前根目录下的 dev 文件夹
# ...如果有，报错并退出
if not os.path.exists(os.path.join(plugin_dir, name)):
    os.symlink(dev_dir, os.path.join(plugin_dir, name))
else:
    print('Folder already exists, exit')
    exit()
