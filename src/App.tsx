import React, { useState, ChangeEvent, useEffect } from 'react';
import logo from './logo.svg';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { API, Storage } from 'aws-amplify';
import { listTodos } from './graphql/queries';
import { createTodo as createTodoMutation, deleteTodo as deleteTodoMutation } from './graphql/mutations';


const initialFormState = { name: '', description: '', image: '' }

interface Itodo {
  id: string
  name: string
  description: string
  image?: string
  createdAt: string
  updatedAt: string
}

type getTodosQuery = {
  listTodos: {
    items: Itodo[]
    nextToken: string
  }
}


function App() {
  const [todos, setTodos] = useState<Itodo[]>([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const apiData = await API.graphql({ query: listTodos }) as { data: getTodosQuery }
    const todosFromAPI = apiData.data.listTodos.items
    // fetch an image if there is an image associated with a note
    await Promise.all(todosFromAPI.map(async todo => {
      if (todo.image) {
        const image = await Storage.get(todo.image);
        todo.image = image;
      }
      return todo;
    }))
    setTodos(apiData.data.listTodos.items);
  }


  async function createTodo() {
    if (!formData.name || !formData.description) return;
    const newTodo = (await API.graphql({ query: createTodoMutation, variables: { input: formData } })) as Itodo
    // add the image to the local image array if an image is associated with the note
    if (formData.image) {
      const image = await Storage.get(formData.image);
      newTodo.image = image;
    }
    setTodos([ ...todos, newTodo ]);
    setFormData(initialFormState);
  }

  // Handle image upload
  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    // ! - Non-null assertion operator
    // If you know from external means that an expression is not null or undefined
    if (!e.target.files![0]) return
    const file = e.target.files![0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchTodos();
  }

  async function deleteTodo({ id }: {id: string}) {
    const newTodosArray = todos.filter(todo => todo.id !== id);
    setTodos(newTodosArray);
    await API.graphql({ query: deleteTodoMutation, variables: { input: { id } }});
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="App">
          <h1>Todo Maker</h1>

          <input
            onChange={e => setFormData({ ...formData, 'name': e.target.value})}
            placeholder="Todo name"
            value={formData.name}
          />
          <input
            onChange={e => setFormData({ ...formData, 'description': e.target.value})}
            placeholder="Todo description"
            value={formData.description}
          />
          <input
            type='file'
            onChange={onChange}
          />
          <button onClick={createTodo}>Create Todo</button>
          <div style={{marginBottom: 30}}>
            {
              todos.map(todo => todo.id && (
                <div key={todo.id}>
                  <h2>{todo.name}</h2>
                  <p>{todo.description}</p>
                  <button onClick={() => deleteTodo(todo)}>Delete Todo</button>
                  {todo.image && <img src={todo.image} style={{width: 400}} />}
                </div>
              ))
            }
          </div>
          <button onClick={signOut}>Sign out</button>
        </div>
      )}
    </Authenticator>
  );
}

export default App;