/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true

 
 
 *    }
 *  });
 * ```
 */

import './index.css';

// DOM Elements
const itemForm = document.getElementById('item-form');
const itemNameInput = document.getElementById('item-name');
const itemDescriptionInput = document.getElementById('item-description');
const itemsList = document.getElementById('items-list');
const refreshBtn = document.getElementById('refresh-btn');
const dbStatus = document.getElementById('db-status');

function editContent(element){
  element.contentEditable = true;
  element.focus();
  element.style.outline = 'none';
}

async function saveContent(element, id, field){
  element.contentEditable = false;
  await window.electronAPI.updateItem(id, field, element.textContent.trim());
}



// More than 1

function loadItemDOM(item){
  const li = document.createElement('li');
  li.className = 'item';
  
  const checkBox = document.createElement('input');
  checkBox.type = 'checkbox';
  checkBox.id = 'toggle';
  if (item.completed === true){checkBox.checked = true; li.classList.add('completed');}
  
  checkBox.addEventListener('change', async(e) =>{
    if (checkBox.checked){
      await window.electronAPI.updateItem(item._id, 'completed', true);
      li.classList.add('completed');
      console.log("On!");
    } else {
      await window.electronAPI.updateItem(item._id, 'completed', false);
      li.classList.remove('completed')
      console.log("Not on!");
    }
  })

  li.appendChild(checkBox);


  const title = document.createElement('div');
  title.className = 'item-title';
  title.textContent = item.name;
  title.ondblclick = () => editContent(title);
  title.onblur = () => saveContent(title, item._id, 'name');
  title.contentEditable = false;
  li.appendChild(title);
  
  if (item.description) {
    const desc = document.createElement('div');
    desc.className = 'item-desc';
    desc.textContent = item.description;
    desc.ondblclick = () => editContent(desc);
    desc.onblur = () => saveContent(desc, item._id, 'description');
    desc.contentEditable = false;
    li.appendChild(desc);
  }
  
  if (item.createdAt) {
    const date = document.createElement('div');
    date.className = 'item-date';
    date.textContent = new Date(item.createdAt).toLocaleString();
    li.appendChild(date);
  }

  const button = document.createElement('button');
  button.className = 'remove-btn';
  button.addEventListener('click', async(e)=>{
    console.log("Removing item with id:", item._id);  // Use the 'id' here
    await removeItem(item._id);
    await loadItems();
  });
  li.appendChild(button);


      


      
      itemsList.appendChild(li);
}

async function removeItem(id){
  await window.electronAPI.removeItem(id);
}

// Function to fetch and display items
async function loadItems() {
  try {
    // Clear current items
    itemsList.innerHTML = '';
    
    // Set loading state
    dbStatus.textContent = 'Database Status: Loading items...';
    dbStatus.className = 'loading';
    
    // Fetch items from the database
    const response = await window.electronAPI.getItems();
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch items');
    }
    
    const items = response.items;
    console.log(items);
    
    // Display items or a message if empty
    if (items.size === 0) {
      itemsList.innerHTML = '<li class="no-items">No items found. Add some!</li>';
    } else {
      items.forEach(item => {
        if(!item.completed){
          console.log(item);
          loadItemDOM(item);
        }
      });

      items.forEach(item => {
        if(item.completed){
          loadItemDOM(item);
        }
      });
    }
    
    // Update database status
    dbStatus.textContent = 'Database Status: Connected';
    dbStatus.className = 'connected';
    
  } catch (error) {
    console.error('Error loading items:', error);
    dbStatus.textContent = 'Database Status: ' + error.message;
    dbStatus.className = 'error';
    itemsList.innerHTML = '<li class="error">Failed to load items</li>';
  }
}

// Add new item
async function addItem(name, description) {
  try {
    dbStatus.textContent = 'Database Status: Adding item...';
    dbStatus.className = 'loading';
    
    const newItem = {
      name,
      description,
      completed: false,
      createdAt: new Date()
    };
    
    const result = await window.electronAPI.addItem(newItem);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add item');
    }
    
    // Clear form
    itemNameInput.value = '';
    itemDescriptionInput.value = '';
    
    // Reload items
    await loadItems();
    
    dbStatus.textContent = 'Database Status: Item added successfully';
    dbStatus.className = 'connected';
    
  } catch (error) {
    console.error('Error adding item:', error);
    dbStatus.textContent = 'Database Status: ' + error.message;
    dbStatus.className = 'error';
  }
}

// Event: Form submit
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = itemNameInput.value.trim();
  const description = itemDescriptionInput.value.trim();
  
  if (name) {
    await addItem(name, description);
  }
});

refreshBtn.addEventListener('click', async () => {
  await loadItems();
});

document.addEventListener('DOMContentLoaded', loadItems);