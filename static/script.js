// 全局游戏状态
const gameState = {
    currentStoryId: null,
    currentChapterId: null,
    currentSceneId: null,
    stories: {},
    characters: {},
    backgrounds: {},
    userData: {}
};

// DOM元素
const dialogueText = document.getElementById('dialogue-text');
const speakerName = document.getElementById('speaker-name');
const nextBtn = document.getElementById('next-btn');
const choicesContainer = document.getElementById('choices-container');
const backgroundEl = document.getElementById('background');
const characterLeft = document.getElementById('character-left');
const characterCenter = document.getElementById('character-center');
const characterRight = document.getElementById('character-right');

// 初始化游戏
async function initGame() {
    try {
        const response = await fetch('/api/init_game');
        const data = await response.json();
        
        gameState.stories = data.stories;
        gameState.characters = data.characters;
        gameState.backgrounds = data.backgrounds;
        gameState.userData = data.user_data;
        
        // 开始游戏
        startGame();
    } catch (error) {
        console.error('Error initializing game:', error);
        dialogueText.textContent = '游戏初始化失败，请刷新页面重试。';
    }
}

// 开始游戏
function startGame() {
    // 从存档中恢复进度
    const lastStoryId = gameState.userData.last_played_story || Object.keys(gameState.stories)[0];
    const storyProgress = gameState.userData.progress[lastStoryId] || {current_chapter: 1, current_scene: 1};
    
    gameState.currentStoryId = lastStoryId;
    gameState.currentChapterId = storyProgress.current_chapter;
    gameState.currentSceneId = storyProgress.current_scene;
    
    loadScene(gameState.currentStoryId, gameState.currentChapterId, gameState.currentSceneId);
}

// 加载场景
async function loadScene(storyId, chapterId, sceneId) {
    try {
        const response = await fetch(`/api/get_scene/${storyId}/${chapterId}/${sceneId}`);
        const sceneData = await response.json();
        
        if (sceneData.error) {
            console.error('Scene not found:', sceneData.error);
            dialogueText.textContent = '场景未找到';
            return;
        }
        
        // 更新背景
        if (sceneData.background && sceneData.background.image_url) {
            backgroundEl.style.backgroundImage = `url('${sceneData.background.image_url}')`;
        }
        
        // 清空角色显示
        characterLeft.innerHTML = '';
        characterCenter.innerHTML = '';
        characterRight.innerHTML = '';
        
        // 显示角色
        for (const charId in sceneData.characters) {
            const character = sceneData.characters[charId];
            const charDiv = document.createElement('div');
            const charImg = document.createElement('img');
            
            charImg.src = character.avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250"><rect x="70" y="50" width="60" height="120" rx="30" fill="%23d1b3ff"/><circle cx="100" cy="40" r="30" fill="%23ffccdd"/><rect x="80" y="70" width="40" height="60" fill="%23d1b3ff"/><circle cx="90" cy="30" r="8" fill="%23333"/><circle cx="110" cy="30" r="8" fill="%23333"/><path d="M85 55 Q100 65 115 55" stroke="%23333" stroke-width="2" fill="none"/></svg>';
            charImg.alt = character.name;
            
            charDiv.appendChild(charImg);
            
            // 根据角色位置放置
            if (character.position === 'left') {
                characterLeft.appendChild(charDiv);
            } else if (character.position === 'right') {
                characterRight.appendChild(charDiv);
            } else {
                characterCenter.appendChild(charDiv);
            }
        }
        
        // 显示对话
        showDialogue(sceneData.dialogue, sceneData.choices);
        
        // 更新当前场景ID
        gameState.currentSceneId = sceneId;
    } catch (error) {
        console.error('Error loading scene:', error);
        dialogueText.textContent = '加载场景失败';
    }
}

// 显示对话
function showDialogue(dialogueArray, choices) {
    // 隐藏选择按钮和继续按钮
    choicesContainer.style.display = 'none';
    nextBtn.style.display = 'none';
    
    // 如果有对话，则逐条显示
    if (dialogueArray && dialogueArray.length > 0) {
        let currentIndex = 0;
        
        function showNextDialogue() {
            if (currentIndex < dialogueArray.length) {
                const dialogue = dialogueArray[currentIndex];
                
                // 设置说话者名称
                if (gameState.characters[dialogue.speaker]) {
                    speakerName.textContent = gameState.characters[dialogue.speaker].name;
                } else if (dialogue.speaker === 'player') {
                    speakerName.textContent = '玩家';
                } else {
                    speakerName.textContent = dialogue.speaker;
                }
                
                // 设置对话内容
                dialogueText.textContent = dialogue.text;
                
                currentIndex++;
                
                // 如果还有对话，显示继续按钮
                if (currentIndex < dialogueArray.length) {
                    nextBtn.style.display = 'block';
                    nextBtn.onclick = showNextDialogue;
                } else {
                    // 最后一条对话结束后，显示选择或继续按钮
                    if (choices && choices.length > 0) {
                        showChoices(choices);
                    } else {
                        nextBtn.style.display = 'block';
                        nextBtn.textContent = '继续 >';
                        nextBtn.onclick = () => {
                            // 简单地跳转到下一场景（在实际游戏中可能需要更复杂的逻辑）
                            const currentStory = gameState.stories[gameState.currentStoryId];
                            const currentChapter = currentStory.chapters.find(ch => ch.chapter_id === gameState.currentChapterId);
                            const currentSceneIndex = currentChapter.scenes.findIndex(sc => sc.scene_id === gameState.currentSceneId);
                            
                            if (currentSceneIndex < currentChapter.scenes.length - 1) {
                                const nextScene = currentChapter.scenes[currentSceneIndex + 1];
                                loadScene(gameState.currentStoryId, gameState.currentChapterId, nextScene.scene_id);
                            } else {
                                // 如果是最后一幕，循环回第一幕
                                loadScene(gameState.currentStoryId, gameState.currentChapterId, currentChapter.scenes[0].scene_id);
                            }
                        };
                    }
                }
            }
        }
        
        showNextDialogue();
    } else if (choices && choices.length > 0) {
        // 如果没有对话但有选择，直接显示选择
        showChoices(choices);
    }
}

// 显示选择
function showChoices(choices) {
    choicesContainer.innerHTML = '';
    choicesContainer.style.display = 'block';
    
    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice.text;
        button.onclick = async () => {
            // 记录选择
            await saveProgress(choice.next_scene, index);
            
            // 加载下一个场景
            loadScene(gameState.currentStoryId, gameState.currentChapterId, choice.next_scene);
        };
        
        choicesContainer.appendChild(button);
    });
}

// 保存进度
async function saveProgress(nextSceneId, choiceIndex) {
    try {
        const response = await fetch('/api/save_progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                story_id: gameState.currentStoryId,
                chapter_id: gameState.currentChapterId,
                scene_id: gameState.currentSceneId,
                choice_made: choiceIndex
            })
        });
        
        const result = await response.json();
        if (result.status !== 'saved') {
            console.error('Failed to save progress');
        }
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);