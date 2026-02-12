from flask import Flask, render_template, request, jsonify, session
import json
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this to a random secret key

# Load game data
def load_game_data():
    stories = {}
    for filename in os.listdir('stories'):
        if filename.endswith('.json'):
            with open(f'stories/{filename}', 'r', encoding='utf-8') as f:
                story_data = json.load(f)
                stories[story_data['story_id']] = story_data
    
    characters = {}
    for filename in os.listdir('characters'):
        if filename.endswith('.json'):
            with open(f'characters/{filename}', 'r', encoding='utf-8') as f:
                char_data = json.load(f)
                characters.update(char_data)
    
    backgrounds = {}
    for filename in os.listdir('backgrounds'):
        if filename.endswith('.json'):
            with open(f'backgrounds/{filename}', 'r', encoding='utf-8') as f:
                bg_data = json.load(f)
                backgrounds.update(bg_data)
    
    return stories, characters, backgrounds

# Load user data
def load_user_data(user_id):
    filepath = f'user/{user_id}.json'
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # Return default user data if file doesn't exist
        with open('user/default_save.json', 'r', encoding='utf-8') as f:
            default_data = json.load(f)
        default_data['user_id'] = user_id
        return default_data

# Save user data
def save_user_data(user_data):
    filepath = f'user/{user_data["user_id"]}.json'
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(user_data, f, ensure_ascii=False, indent=2)

# Get scene data
def get_scene(story_id, chapter_id, scene_id, stories):
    for chapter in stories[story_id]['chapters']:
        if chapter['chapter_id'] == chapter_id:
            for scene in chapter['scenes']:
                if scene['scene_id'] == scene_id:
                    return scene
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/init_game')
def init_game():
    stories, characters, backgrounds = load_game_data()
    user_id = session.get('user_id', 'guest')
    user_data = load_user_data(user_id)
    
    # Update session with user ID if not already set
    if 'user_id' not in session:
        session['user_id'] = user_id
    
    return jsonify({
        'stories': stories,
        'characters': characters,
        'backgrounds': backgrounds,
        'user_data': user_data
    })

@app.route('/api/get_scene/<story_id>/<int:chapter_id>/<int:scene_id>')
def get_scene_api(story_id, chapter_id, scene_id):
    stories, characters, backgrounds = load_game_data()
    scene = get_scene(story_id, chapter_id, scene_id, stories)
    
    if scene:
        # Expand character and background data
        expanded_scene = {
            'scene_id': scene['scene_id'],
            'background': backgrounds[scene['background']],
            'characters': {},
            'dialogue': scene['dialogue'],
            'choices': scene.get('choices', [])
        }
        
        for char_id in scene['characters']:
            if char_id in characters:
                expanded_scene['characters'][char_id] = characters[char_id]
        
        # Add player character
        expanded_scene['characters']['player'] = {
            'name': '玩家',
            'position': 'center'
        }
        
        return jsonify(expanded_scene)
    else:
        return jsonify({'error': 'Scene not found'}), 404

@app.route('/api/save_progress', methods=['POST'])
def save_progress():
    user_id = session.get('user_id', 'guest')
    user_data = load_user_data(user_id)
    
    data = request.json
    story_id = data.get('story_id')
    chapter_id = data.get('chapter_id')
    scene_id = data.get('scene_id')
    choice_made = data.get('choice_made')
    
    # Update progress
    if story_id not in user_data['progress']:
        user_data['progress'][story_id] = {
            'current_chapter': 1,
            'current_scene': 1,
            'visited_scenes': [],
            'choices_made': []
        }
    
    user_data['progress'][story_id]['current_chapter'] = chapter_id
    user_data['progress'][story_id]['current_scene'] = scene_id
    
    if scene_id not in user_data['progress'][story_id]['visited_scenes']:
        user_data['progress'][story_id]['visited_scenes'].append(scene_id)
    
    if choice_made is not None:
        user_data['progress'][story_id]['choices_made'].append({
            'scene_id': scene_id,
            'choice_index': choice_made
        })
    
    # Update last played story
    user_data['last_played_story'] = story_id
    
    save_user_data(user_data)
    return jsonify({'status': 'saved'})

if __name__ == '__main__':
    app.run(debug=True)