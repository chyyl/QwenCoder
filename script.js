// 游戏数据
const gameData = {
    currentScene: 0,
    playerName: "",
    choices: [],
    
    scenes: [
        {
            speaker: "神秘仙人",
            text: "欢迎来到仙境，有缘人。我感受到你身上有一股特殊的缘分之力。",
            choices: null
        },
        {
            speaker: "神秘仙人",
            text: "你是否愿意接受我的考验，探寻自己的仙缘之路？",
            choices: [
                { text: "当然愿意！我渴望力量！", nextScene: 2 },
                { text: "谨慎一些，先了解情况", nextScene: 3 }
            ]
        },
        {
            speaker: "神秘仙人",
            text: "很好！勇敢的人，你的第一项考验是穿越迷雾森林。",
            choices: null
        },
        {
            speaker: "神秘仙人", 
            text: "明智的选择。在踏上仙途之前，你需要了解一些基本规则。",
            choices: null
        },
        {
            speaker: "神秘仙人",
            text: "经过初步考验，你的仙缘之路正式开启。恭喜你，有缘人！",
            choices: null
        }
    ]
};

// DOM元素
const dialogueText = document.getElementById('dialogue-text');
const speakerName = document.getElementById('speaker-name');
const nextBtn = document.getElementById('next-btn');
const choiceBox = document.getElementById('choice-box');
const choiceButtons = document.querySelectorAll('.choice-btn');

let currentSceneIndex = 0;

// 显示场景
function showScene(index) {
    const scene = gameData.scenes[index];
    if (!scene) {
        // 如果到达结尾，重新开始
        currentSceneIndex = 0;
        showScene(currentSceneIndex);
        return;
    }
    
    speakerName.textContent = scene.speaker;
    dialogueText.textContent = scene.text;
    
    if (scene.choices) {
        // 显示选择
        choiceBox.style.display = 'block';
        nextBtn.style.display = 'none';
        
        // 清空之前的选择按钮
        while(choiceBox.firstChild) {
            if (choiceBox.firstChild.tagName !== 'BUTTON') break;
            choiceBox.removeChild(choiceBox.firstChild);
        }
        
        // 创建新的选择按钮
        scene.choices.forEach((choice, i) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.dataset.nextScene = choice.nextScene;
            btn.onclick = () => {
                currentSceneIndex = choice.nextScene;
                choiceBox.style.display = 'none';
                nextBtn.style.display = 'block';
                showScene(currentSceneIndex);
            };
            choiceBox.appendChild(btn);
        });
    } else {
        // 隐藏选择，显示继续按钮
        choiceBox.style.display = 'none';
        nextBtn.style.display = 'block';
    }
}

// 下一页事件
nextBtn.addEventListener('click', () => {
    currentSceneIndex++;
    if (currentSceneIndex >= gameData.scenes.length) {
        // 如果到达结尾，重新开始
        currentSceneIndex = 0;
    }
    showScene(currentSceneIndex);
});

// 初始化游戏
showScene(currentSceneIndex);