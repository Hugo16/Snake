/**
 * @description 蛇身体的块
 * @param option
 * @constructor
 */
function SnakeBlock(option) {
    this._init(option);
}

SnakeBlock.prototype = {
    constructor: SnakeBlock,
    // 初始化函数
    _init: function (option) {
        let opt = option || {};
        // 属性
        this.r = opt.r || 30;
        this.bgColor = opt.bgColor || "skyblue";
        this.positionX = opt.positionX || 0;
        this.positionY = opt.positionY || 0;
        this.parent = opt.parent;
        this.zIndex = opt.zIndex || 0;
        this.className = opt.className || "";
        this.border = opt.border || "1px solid white";
        this.boxSizing = opt.boxSizing || "border-box";
    },

    // 渲染函数
    render: function () {
        let parentNode = this.parent;
        parentNode.style.position = "relative";

        // 创建子节点
        let childNode = document.createElement("div");
        childNode.style.width = this.r + "px";
        childNode.style.height = this.r + "px";
        childNode.style.backgroundColor = this.bgColor;
        childNode.style.left = this.positionX + "px";
        childNode.style.top = this.positionY + "px";
        childNode.style.zIndex = this.zIndex;
        childNode.style.position = "absolute";
        childNode.style.border = this.border;
        childNode.style.boxSizing = this.boxSizing;
        childNode.className = this.className;

        parentNode.appendChild(childNode);
        this.node = childNode;
    },

    // 移动函数
    move: function (position) {
        this.node.style.left = position[0] + "px";
        this.node.style.top = position[1] + "px";
    }
};


/**
 * @description 蛇头
 * @param option
 * @constructor
 */
function SnakeHead(option) {
    SnakeBlock.call(this, option);
    this.bgColor = "deepskyblue";
    // 设置蛇头显示层级(蛇块为0)
    this.zIndex = 1;
}

SnakeHead.prototype = new SnakeBlock();
SnakeHead.prototype.constructor = SnakeHead;


/**
 * @description 整条蛇
 * @param option
 * @constructor
 */
function Snake(option) {
    this._init(option);
}

Snake.prototype = {
    constructor: Snake,

    // 初始化函数
    _init: function (option) {
        this.option = option || {};
        // 蛇头初始位置
        let x = this.option.positionX;
        let y = this.option.positionY;

        // 组成蛇的蛇头和块的数组
        this.snakeBody = [];
        // 蛇身体每个块的位置
        this.bodyPosition = [[x, y]];
        // 蛇默认走的方向
        this.direction = this.option.direction || "right";
        // 蛇的父容器id
        this.parent = this.option.parent;
        // 用来保存食物对象
        this.food = null;
        // 用来保存蛇的移动状态
        this.moving = false;
        // 蛇的默认长度
        this.long = this.option.long || 5;
        // 死亡音效
        this.music = this.option.music;

        // 新建一个蛇头保存到数组里
        let snakeHead = new SnakeHead(this.option);
        snakeHead.render();
        this.snakeBody.push(snakeHead);
        // 蛇身体块的大小
        this.r = snakeHead.r;

        // 创建5个蛇块，放到身体数组里，并保存位置
        for (let i = 1; i < this.long + 1; i++) {
            let snakeBLock = new SnakeBlock(this.option);
            snakeBLock.render();
            snakeBLock.move([x - this.option.r * i, y]);
            this.snakeBody.push(snakeBLock);
            this.bodyPosition[i] = [x - this.option.r * i, y];
        }
    },

    // 蛇自动走
    autoMove: function () {
        let snake = this;

        function am(snake) {
            // 获取当前蛇头的位置
            let l = snake.snakeBody[0].node.offsetLeft;
            let t = snake.snakeBody[0].node.offsetTop;

            // 获取父容器边框为位置
            let playGround = snake.parent;
            let pgR = playGround.offsetWidth;
            let pgB = playGround.offsetHeight;

            // 判断下一步该往那个方向走
            let position;
            if (snake.direction == "left") {
                // 判断是否超过容器边界
                if (l <= 0) {
                    l = pgR;
                }
                position = [l - snake.r, t];
            } else if (snake.direction == "up") {
                // 判断是否超过容器边界
                if (t <= 0) {
                    t = pgB;
                }
                position = [l, t - snake.r];
            }
            else if (snake.direction == "right") {
                // 判断是否超过容器边界
                if (l >= pgR - snake.r) {
                    l = -snake.r;
                }
                position = [l + snake.r, t];
            }
            else {
                // 判断是否超过容器边界
                if (t >= pgB - snake.r) {
                    t = -snake.r;
                }
                position = [l, t + snake.r];
            }

            // 先保存最后一个位置备用
            let lastPosition = snake.bodyPosition[snake.bodyPosition.length - 1];
            // 让每一个蛇块移动到其前一个蛇块的位置
            for (let i = snake.bodyPosition.length - 1; i > 0; i--) {
                snake.snakeBody[i].move(snake.bodyPosition[i - 1]);
                snake.bodyPosition[i] = snake.bodyPosition[i - 1];
            }
            // 改变蛇头的位置
            snake.snakeBody[0].move(position);
            snake.bodyPosition[0] = position;

            // 判断是否碰到自己
            if (snake.touchSelf(position[0], position[1])) {
                clearInterval(snake.timer);
                snake.music.play();
            }

            // 判断是否吃到食物
            if (snake.touchFood(position[0], position[1])) {
                // 添加一个新的蛇块
                let snakeBLock = new SnakeBlock(snake.option);
                snakeBLock.render();
                snakeBLock.move(lastPosition);
                snake.snakeBody.push(snakeBLock);
                snake.bodyPosition.push(lastPosition);

                // 调用食物被吃掉的函数
                snake.food.beAte(snake);
            }

            snake.moving = false;
        }

        this.timer = setInterval(function () {
            am(snake);
        }, 100);
    },

    // 改变方向
    changeDirection: function (direction) {
        if (!this.moving) {
            this.moving = true;
            switch (direction) {
                case "left":
                    // 向右走的时候不能向左走，下同
                    if (this.direction != "right") {
                        this.direction = direction;
                    }
                    break;
                case "up":
                    if (this.direction != "down") {
                        this.direction = direction;
                    }
                    break;
                case "right":
                    if (this.direction != "left") {
                        this.direction = direction;
                    }
                    break;
                case "down":
                    if (this.direction != "up") {
                        this.direction = direction;
                    }
                    break;
            }
        }
    },

    // 碰到自身
    touchSelf: function (l, t) {
        let p = this.bodyPosition;
        for (let i = 1; i < p.length; i++) {
            if (l == p[i][0] && t == p[i][1]) {
                return true;
            }
        }
        return false;
    },

    // 碰到食物
    touchFood: function (l, t) {
        return (l == this.food.positionX && t == this.food.positionY);
    }
};

/**
 * @description 食物对象
 * @param option 参数
 * @param snake 属于哪条蛇
 * @param score 分数元素
 * @param music 音效
 * @constructor
 */
function Food(option, snake, score, music) {
    SnakeBlock.call(this, option);
    this.bgColor = "yellow";
    this.r = snake.r;
    this.score = score;
    this.music = music;
    // 设置食物的位置
    this.setPosition(snake);
}

Food.prototype = new SnakeBlock();
Food.prototype.constructor = Food;
// 设置食物的位置
Food.prototype.setPosition = function (snake) {
    // 根据父容器大小随机设置食物的位置
    let parent = this.parent;
    this.positionX = parseInt(parent.offsetWidth / snake.r * Math.random()) * snake.r;
    this.positionY = parseInt(parent.offsetHeight / snake.r * Math.random()) * snake.r;

    // 判断生成的位置是否和蛇的位置重叠
    for (let i = 0; i < snake.bodyPosition.length; i++) {
        if (
            this.positionX == snake.bodyPosition[i][0]
            && this.positionY == snake.bodyPosition[i][1]
        ) {
            // 如果重叠就重新随机设置
            this.setPosition(snake);
        }
    }
};
// 食物被吃掉时调用的函数
Food.prototype.beAte = function (snake) {
    // 播放被吃掉的音乐
    this.music.play();
    // 重新设置食物的位置
    this.setPosition(snake);
    this.node.style.left = this.positionX + "px";
    this.node.style.top = this.positionY + "px";
    // 长度加一
    let score = parseInt(this.score.innerHTML);
    this.score.innerHTML = score + 1;
};

/**
 * @description 创建元素
 * @param tagName 标签名称
 * @param option 属性对象
 * @returns {Element}
 */
function createElement(tagName, option) {
    let ele = document.createElement(tagName);
    let opt = option || {};
    for (let key in opt) {
        ele.style[key] = opt[key];
    }
    return ele;
};

/**
 * @description 清屏
 * @param ele 要清屏的元素
 */
function cleanScreen(ele) {
    let object = ele;
    let j = object.children.length;
    for (let i = 0; i < j; i++) {
        object.removeChild(object.children[0]);
    }
}