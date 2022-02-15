import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { API } from 'aws-amplify';
import { listTodos } from './graphql/queries';
import { createTodo as createTodoMutation, deleteTodo as deleteTodoMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const apiData = await API.graphql({ query: listTodos });
    console.log("list of todos:", apiData.data.listTodos.items)
    setNotes(apiData.data.listTodos.items);
  }

  async function createTodo() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createTodoMutation, variables: { input: formData } });
    setTodos([ ...todos, formData ]);
    setFormData(initialFormState);
  }

  async function deleteTodo({ id }) {
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
          <button onClick={createTodo}>Create Todo</button>
          <div style={{marginBottom: 30}}>
            {
              notes.map(note => (
                <div key={todo.id || todo.name}>
                  <h2>{todo.name}</h2>
                  <p>{todo.description}</p>
                  <button onClick={() => deleteTodo(todo)}>Delete Todo</button>
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
