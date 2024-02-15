#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
Python dev server for Plant Humanities Lab site.
Dependencies: bs4 fastapi html5lib Markdown pymdown-extensions PyYAML uvicorn
'''

import logging
logging.basicConfig(format='%(asctime)s : %(filename)s : %(levelname)s : %(message)s')
logger = logging.getLogger()
logger.setLevel(logging.INFO)

import argparse, json, os, re

BASEDIR = os.path.dirname(os.path.abspath(os.path.dirname(__file__)))
LOCAL_WC = os.environ.get('LOCAL_WC', 'false').lower() == 'true'
LOCAL_WC_JUNCTURE = os.environ.get('LOCAL_WC_JUNCTURE', 'false').lower() == 'true'
LOCAL_WC_PORT = os.environ.get('LOCAL_WC_PORT', '5173')
CONTENT_ROOT = os.environ.get('CONTENT_ROOT', BASEDIR)

from bs4 import BeautifulSoup
import markdown
import yaml

from typing import Optional

import uvicorn

from fastapi import FastAPI
from fastapi.responses import Response

from fastapi.middleware.cors import CORSMiddleware

origins = ['*']

app = FastAPI(title='ezsite', root_path='/')

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

media_types = {
  'css': 'text/css',
  'html': 'text/html',
  'ico': 'image/vnd. microsoft. icon',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'js': 'text/javascript',
  'json': 'application/json',
  'md': 'text/markdown',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain',
  'yaml': 'application/x-yaml'
}

favicon = open(f'{BASEDIR}/favicon.ico', 'rb').read() if os.path.exists(f'{BASEDIR}/favicon.ico') else None

html_template = open(f'{CONTENT_ROOT}/_layouts/default.html', 'r').read().replace('/essays', 'http://localhost:8080/')
html_template = re.sub(r'https:\/\/.+\/ezsite\/', '/', html_template)

html_template = html_template.replace('https://rsnyder.github.io/ezsite', '')
if LOCAL_WC: html_template = html_template.replace('/wc/js/index.js', f'http://localhost:{LOCAL_WC_PORT}/main.ts')
if LOCAL_WC_JUNCTURE: html_template = html_template.replace('/juncture/v2/dist/js/index.js', f'http://localhost:{LOCAL_WC_PORT}/src/main.ts')
html_template = html_template.replace('{{ site.baseurl }}', '')
html_template = html_template.replace('{%- seo -%}', '')

def html_from_markdown(md, baseurl):
  html = html_template.replace('{{ content }}', markdown.markdown(md, extensions=['extra', 'toc']))
  soup = BeautifulSoup(html, 'html5lib')
      
  for link in soup.find_all('a'):
    href = link.get('href')
    if href and not href.startswith('http') and not href.startswith('#') and not href.startswith('/') and not href.startswith('mailto:'):
      link['href'] = f'{baseurl}{href}'
  
  for img in soup.find_all('img'):
    src = img.get('src')
    if not src.startswith('http') and not src.startswith('/'):
      img['src'] = f'{baseurl}{src}'
      
  for code in soup.find_all('code'):
    if code.parent.name == 'pre':
      top_div = soup.new_tag('div')
      if code.get('class'): top_div['class'] = code.get('class')
      wrapper_div = soup.new_tag('div')
      top_div.append(wrapper_div)
      pre = soup.new_tag('pre')
      wrapper_div.append(pre)
      new_code = soup.new_tag('code')
      new_code.string = code.string
      pre.append(new_code)
      code.parent.replace_with(top_div)
      
  for param in soup.find_all('param'):
    node = param.parent
    while node.next_sibling and node.next_sibling.name == 'param':
      node = node.next_sibling
    node.insert_after(param)
  for para in soup.find_all('p'):
    if para.renderContents().decode('utf-8').strip() == '':
      para.decompose()
      
  # logger.info(soup.prettify())
  return str(soup)
  
@app.get('{path:path}')
async def serve(path: Optional[str] = None):
  path = [pe for pe in path.split('/') if pe != ''] if path else []
  ext = path[-1].split('.')[-1].lower() if len(path) > 0 and '.' in path[-1] else None

  if len(path) > 0 and CONTENT_ROOT != BASEDIR and path[0] in ['index.css', 'index.js', 'favicon.ico', 'images', 'juncture', 'src', 'wc']:
    local_file_path = f'{BASEDIR}/{"/".join(path)}'

  elif ext:
    local_file_path = f'{CONTENT_ROOT}/{"/".join(path)}'
    if not os.path.exists(local_file_path):
      return Response(status_code=404, content=f'Page "{path}" not found at {local_file_path}', media_type='text/html')
  else: 
    local_file_path = f'{CONTENT_ROOT}/{"/".join(path)}/index.html'
    if os.path.exists(local_file_path):
      ext = 'html'
    else:
      for mdIndex in ['index.md', 'README.md']:
        if os.path.exists(f'{CONTENT_ROOT}/{"/".join(path)}/{mdIndex}'):
          break
      local_file_path = f'{CONTENT_ROOT}/{"/".join(path)}' if ext else f'{CONTENT_ROOT}/{"/".join(path)}/{mdIndex}'
      if os.path.exists(local_file_path):
        pass
      elif os.path.exists(f'{CONTENT_ROOT}/{"/".join(path)}.md'):
        local_file_path = f'{CONTENT_ROOT}/{"/".join(path)}.md'
      else:
        return Response(status_code=404, content=f'Page "{path}" not found at {local_file_path}', media_type='text/html')
  
  if ext == 'ico':
    content = favicon
  elif ext in ['jpg', 'jpeg', 'png', 'svg']:
    content = open(local_file_path, 'rb').read()
  else:
    content = open(local_file_path, 'r').read()
    if LOCAL_WC and ext == 'html':
      content = content.replace('/wc/js/index.js', f'http://localhost:{LOCAL_WC_PORT}/src/main.ts')
  if ext is None: # markdown file
    content = html_from_markdown(content, baseurl=f'/{"/".join(path)}/' if len(path) > 0 else '/')
  media_type = media_types[ext] if ext in media_types else 'text/html'

  logger.debug(f'path: {path} ext: {ext} local_file_path: {local_file_path}')
  return Response(status_code=200, content=content, media_type=media_type)

if __name__ == '__main__':
  logger.setLevel(logging.INFO)
  parser = argparse.ArgumentParser(description='Plant Humanities Lab dev server')  
  parser.add_argument('--reload', type=bool, default=True, help='Reload on change')
  parser.add_argument('--port', type=int, default=8080, help='HTTP port')
  parser.add_argument('--localwc', default=False, action='store_true', help='Use local web components')
  parser.add_argument('--localwc-juncture', default=False, action='store_true', help='Use local Juncture web components')
  parser.add_argument('--wcport', type=int, default=5173, help='Port used by local WC server')
  parser.add_argument('--content', default=BASEDIR, help='Content root directory')

  args = vars(parser.parse_args())
  
  os.environ['LOCAL_WC'] = str(args['localwc'])
  os.environ['LOCAL_WC_JUNCTURE'] = str(args['localwc_juncture'])
  os.environ['LOCAL_WC_PORT'] = str(args['wcport'])
  os.environ['CONTENT_ROOT'] = os.path.abspath(str(args['content']))

  logger.info(f'BASEDIR={BASEDIR} CONTENT_ROOT={os.environ["CONTENT_ROOT"]} LOCAL_WC={os.environ["LOCAL_WC"]} LOCAL_WC_JUNCTURE={os.environ["LOCAL_WC_JUNCTURE"]} LOCAL_WC_PORT={os.environ["LOCAL_WC_PORT"]} ')

  uvicorn.run('serve:app', port=args['port'], log_level='info', reload=args['reload'])