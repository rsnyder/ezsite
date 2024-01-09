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
  'txt': 'text/plain',
  'yaml': 'application/x-yaml'
}

config = yaml.load(open(f'{BASEDIR}/_config.yml', 'r'), Loader=yaml.FullLoader) if os.path.exists(f'{BASEDIR}/_config.yml') else {}
logger.debug(json.dumps(config, indent=2))

mode = config.get('mode', 'default')
title = config.get('title', 'Juncture')
description = config.get('description', '')
url = config.get('url', '')
gh_owner = config.get('github', {}).get('owner', '')
gh_repo = config.get('github', {}).get('repo', '')
gh_branch = config.get('github', {}).get('branch', '')
components = config.get('components', '').replace('/juncture/wc/dist/js/index.js', 'http://localhost:5173/src/main.ts') if LOCAL_WC else config.get('components', '')

jsonld_seo = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'description': description,
  'headline': title,
  'name': title,
  'url': url
}

seo = f'''
  <title>{title}</title>
  <meta name="generator" content="Jekyll v3.9.3" />
  <meta property="og:title" content="{title}" />
  <meta property="og:locale" content="en_US" />
  <meta name="description" content="{description}" />
  <meta property="og:description" content="{description}" />
  <link rel="canonical" href="{url}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:site_name" content="{title}" />
  <meta property="og:type" content="website" />
  <script type="application/ld+json">
  {json.dumps(jsonld_seo, indent=2)}
  </script>
'''

not_found_page = open(f'{BASEDIR}/404.html', 'r').read() if os.path.exists(f'{BASEDIR}/404.html') else ''
header = open(f'{BASEDIR}/_includes/header.html', 'r').read() if os.path.exists(f'{BASEDIR}/_includes/header.html') else ''
footer = open(f'{BASEDIR}/_includes/footer.html', 'r').read() if os.path.exists(f'{BASEDIR}/_includes/footer.html') else ''
favicon = open(f'{BASEDIR}/favicon.ico', 'rb').read() if os.path.exists(f'{BASEDIR}/favicon.ico') else None

html_template = open(f'{BASEDIR}/_layouts/default.html', 'r').read().replace('/essays', 'http://localhost:8080/')
html_template = re.sub(r'^\s*{%- include header.html -%}', header, html_template, flags=re.MULTILINE)
html_template = re.sub(r'^\s*{%- include footer.html -%}', footer, html_template, flags=re.MULTILINE)

html_template = html_template.replace('/ezsite/dist/js/index.js', 'http://localhost:5173/main.ts')
html_template = html_template.replace('{%- seo -%}', seo)
html_template = html_template.replace('{{ site.mode }}', mode)
html_template = html_template.replace('{{ site.github.owner }}', gh_owner)
html_template = html_template.replace('{{ site.github.repo }}', gh_repo)
html_template = html_template.replace('{{ site.github.branch }}', gh_branch)
html_template = html_template.replace('{{ site.baseurl }}', '')
html_template = html_template.replace('{{ site.components }}', components)
  
def html_from_markdown(md, baseurl):
  html = html_template.replace('{{ content }}', markdown.markdown(md, extensions=['extra', 'toc']))
  soup = BeautifulSoup(html, 'html5lib')

  for bc in soup.find_all('blockquote'):
    for para in bc.find_all('p'):
      if para.string.startswith('ez-'):
        bc_lines = para.string.split('\n- ')
        new_bc = soup.new_tag('blockquote')
        new_bc.append(soup.new_tag('p'))
        new_bc.p.string = bc_lines[0]
        bc.insert_before(new_bc)
        if len(bc_lines) > 1:
          new_bc.append(soup.new_tag('ul'))
          for ln in bc_lines[1:]:
            li = soup.new_tag('li')
            li.string = ln
            new_bc.ul.append(li)
        para.decompose()
    if bc.renderContents().decode('utf-8').strip() == '':
      bc.decompose()
      
  for link in soup.find_all('a'):
    href = link.get('href')
    if href and not href.startswith('http') and not href.startswith('#') and not href.startswith('/'):
      link['href'] = f'{baseurl}{href}'
  for img in soup.find_all('img'):
    src = img.get('src')
    if not src.startswith('http') and not src.startswith('/'):
      img['src'] = f'{baseurl}{src}'

  for param in soup.find_all('param'):
    node = param.parent
    while node.next_sibling.name == 'param':
      node = node.next_sibling
    node.insert_after(param)
  for para in soup.find_all('p'):
    if para.renderContents().decode('utf-8').strip() == '':
      para.decompose()
  return str(soup)
  
@app.get('/{path:path}')
async def serve(path: Optional[str] = None):
  path = [pe for pe in path.split('/') if pe != ''] if path else []
  ext = path[-1].split('.')[-1].lower() if len(path) > 0 and '.' in path[-1] else None
  local_file_path = f'{BASEDIR}/{"/".join(path)}' if ext else f'{BASEDIR}/{"/".join(path)}/README.md'
  logger.info(f'path: {path} ext: {ext} local_file_path: {local_file_path}')
  if os.path.exists(local_file_path):
    pass
  elif os.path.exists(f'{BASEDIR}/{"/".join(path)}.md'):
    local_file_path = f'{BASEDIR}/{"/".join(path)}.md'
  elif os.path.exists(f'{BASEDIR}/{"/".join(path)}/index.html'):
    local_file_path = f'{BASEDIR}/{"/".join(path)}/index.html'
    ext = 'html'
  else:
      return Response(status_code=404, content=not_found_page, media_type='text/html')
  if ext == 'ico':
    content = favicon
  elif ext in ['jpg', 'jpeg', 'png', 'svg']:
    content = open(local_file_path, 'rb').read()
  else:
    content = open(local_file_path, 'r').read()
    if LOCAL_WC and ext == 'html':
      content = content.replace('/ezsite/dist/js/index.js', 'http://localhost:5173/src/main.ts')
  if ext is None: # markdown file
    content = html_from_markdown(content, baseurl=f'/{"/".join(path)}/' if len(path) > 0 else '/')
  media_type = media_types[ext] if ext in media_types else 'text/html'
  return Response(status_code=200, content=content, media_type=media_type)

if __name__ == '__main__':
  logger.setLevel(logging.INFO)
  parser = argparse.ArgumentParser(description='Plant Humanities Lab dev server')  
  parser.add_argument('--reload', type=bool, default=True, help='Reload on change')
  parser.add_argument('--port', type=int, default=8080, help='HTTP port')
  parser.add_argument('--localwc', default=False, action='store_true', help='Use local web components')

  args = vars(parser.parse_args())
  
  os.environ['LOCAL_WC'] = str(args['localwc'])

  logger.info(f'BASEDIR: {BASEDIR} LOCAL_WC: {os.environ["LOCAL_WC"]}')

  uvicorn.run('serve:app', port=args['port'], log_level='info', reload=args['reload'])