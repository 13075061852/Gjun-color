const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(express.static('.'));

// 读取配方数据
async function readRecipes() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'info.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取配方数据时出错:', error);
    return [];
  }
}

// 写入配方数据
async function writeRecipes(recipes) {
  try {
    await fs.writeFile(path.join(__dirname, 'info.json'), JSON.stringify(recipes, null, 2));
    return true;
  } catch (error) {
    console.error('写入配方数据时出错:', error);
    return false;
  }
}

// 获取所有配方
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await readRecipes();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: '获取配方数据时出错' });
  }
});

// 添加新配方
app.post('/api/recipes', async (req, res) => {
  try {
    const recipes = await readRecipes();
    const newRecipe = req.body;
    
    // 检查编号是否已存在
    if (recipes.some(recipe => recipe.id === newRecipe.id)) {
      return res.status(400).json({ error: '编号已存在' });
    }
    
    // 添加时间戳
    newRecipe.time = new Date().toLocaleString('zh-CN');
    recipes.push(newRecipe);
    
    const success = await writeRecipes(recipes);
    if (success) {
      res.status(201).json(newRecipe);
    } else {
      res.status(500).json({ error: '保存配方时出错' });
    }
  } catch (error) {
    res.status(500).json({ error: '添加配方时出错' });
  }
});

// 更新配方
app.put('/api/recipes/:id', async (req, res) => {
  try {
    const recipes = await readRecipes();
    const id = req.params.id;
    const updatedRecipe = req.body;
    
    const index = recipes.findIndex(recipe => recipe.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '配方未找到' });
    }
    
    // 更新时间戳
    updatedRecipe.time = new Date().toLocaleString('zh-CN');
    recipes[index] = updatedRecipe;
    
    const success = await writeRecipes(recipes);
    if (success) {
      res.json(updatedRecipe);
    } else {
      res.status(500).json({ error: '更新配方时出错' });
    }
  } catch (error) {
    res.status(500).json({ error: '更新配方时出错' });
  }
});

// 删除配方
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const recipes = await readRecipes();
    const id = req.params.id;
    
    const newRecipes = recipes.filter(recipe => recipe.id !== id);
    
    if (newRecipes.length === recipes.length) {
      return res.status(404).json({ error: '配方未找到' });
    }
    
    const success = await writeRecipes(newRecipes);
    if (success) {
      res.json({ message: '配方删除成功' });
    } else {
      res.status(500).json({ error: '删除配方时出错' });
    }
  } catch (error) {
    res.status(500).json({ error: '删除配方时出错' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`配方管理系统服务器运行在 http://localhost:${PORT}`);
});