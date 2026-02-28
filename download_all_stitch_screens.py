import urllib.request
import json
import os

API_KEY = 'AQ.Ab8RN6KVww90cArcHgWeyXtiGW-QNxQ4zDbN4mX2wXkZRWStzQ'
PROJECT_ID = '18263562648051687417'
BASE_URL = 'https://stitch.googleapis.com/v1'

headers = {
    'X-Goog-Api-Key': API_KEY,
    'Accept': 'application/json'
}

# Create output directories
os.makedirs('mobile/stitch-assets/screens', exist_ok=True)

# Get all screens
print('Fetching all screens from Stitch project...')
req = urllib.request.Request(f'{BASE_URL}/projects/{PROJECT_ID}/screens', headers=headers)

try:
    with urllib.request.urlopen(req, timeout=60) as response:
        data = json.loads(response.read().decode())
        screens = data.get('screens', [])
        print(f'Found {len(screens)} screens\n')
        
        summary = []
        
        for i, screen in enumerate(screens, 1):
            screen_id = screen.get('id', 'unknown')
            title = screen.get('title', 'Untitled')
            
            print(f'{i}/{len(screens)}: {title} ({screen_id})')
            
            screen_info = {
                'id': screen_id,
                'title': title,
                'prompt': screen.get('prompt', ''),
                'screenshot_url': '',
                'html_url': ''
            }
            
            # Download screenshot
            screenshot = screen.get('screenshot', {})
            if screenshot and screenshot.get('downloadUrl'):
                try:
                    img_req = urllib.request.Request(
                        screenshot['downloadUrl'],
                        headers={'User-Agent': 'Mozilla/5.0'}
                    )
                    with urllib.request.urlopen(img_req, timeout=60) as img_resp:
                        safe_name = title.replace(' ', '_').replace('/', '_').lower()[:50]
                        filepath = f'mobile/stitch-assets/screens/{safe_name}_{screen_id[:8]}.png'
                        with open(filepath, 'wb') as f:
                            f.write(img_resp.read())
                    print(f'  [OK] Screenshot: {filepath}')
                    screen_info['screenshot_url'] = filepath
                except Exception as e:
                    print(f'  [ERR] Screenshot error: {e}')
            
            # Download HTML
            html_code = screen.get('htmlCode', {})
            if html_code and html_code.get('downloadUrl'):
                try:
                    html_req = urllib.request.Request(
                        html_code['downloadUrl'],
                        headers={'User-Agent': 'Mozilla/5.0'}
                    )
                    with urllib.request.urlopen(html_req, timeout=60) as html_resp:
                        safe_name = title.replace(' ', '_').replace('/', '_').lower()[:50]
                        filepath = f'mobile/stitch-assets/screens/{safe_name}_{screen_id[:8]}.html'
                        with open(filepath, 'wb') as f:
                            f.write(html_resp.read())
                    print(f'  [OK] HTML: {filepath}')
                    screen_info['html_url'] = filepath
                except Exception as e:
                    print(f'  [ERR] HTML error: {e}')
            
            summary.append(screen_info)
            print()
        
        # Save summary
        with open('mobile/stitch-assets/screens/summary.json', 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f'[DONE] Downloaded {len(screens)} screens!')
        print('Summary saved to: mobile/stitch-assets/screens/summary.json')
        
except Exception as e:
    print(f'Error: {e}')
