import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { API } from 'aws-amplify';
import { listTodos } from './graphql/queries';
import { createTodo, createTodo as createTodoMutation, deleteTodo as deleteTodoMutation } from './graphql/mutations';


const initialFormState = { name: '', description: '' }

// interface TodoState {
//   todos: {
//     // The question make means the type for that property is optional. 
//     // It can either be a number or undefined
//     id: string
//     name: string
//     description: string
//     createdAt: string
//     updatedAt: string
//   }[]
//   // the brackets above means that its an array
// }

interface Itodo {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}


type getTodosQuery = {
  listTodos: {
    items: Itodo[]
    nextToken: string
  }
}

interface InewTodo {
  createTodo: {
    id: string
    name: string
    description: string
    createdAt: string
    updatedAt: string
  }
}


function App() {
  const [todos, setTodos] = useState<Itodo[]>([]);
  // Rewrite form data state with normal object declaration
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTodos();
  }, [todos]);

  async function fetchTodos() {
    try {
      const apiData = (await API.graphql({ query: listTodos })) as {
        data: getTodosQuery
      }
      setTodos(apiData.data.listTodos.items);
    } catch (error) {
      console.log(error)
    }
  }

  async function createTodo() {
    if (!formData.name || !formData.description) return;
    const newTodo = (await API.graphql({ query: createTodoMutation, variables: { input: formData } })) as {
      id: string
      name: string
      description: string
      createdAt: string
      updatedAt: string
    }
    console.log(newTodo)
    setTodos([ ...todos, newTodo ]);
    setFormData(initialFormState);
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
          <button onClick={createTodo}>Create Todo</button>
          <div style={{marginBottom: 30}}>
            {
              todos.map(todo => todo.id && (
                // <div key={todo.id || todo.name}>
                <div key={todo.id}>
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

// Delete function takes in the id from the todo object which is destructured
// The id property is optional in the object. It is optional because it needs to be defined but wont be there until it is created in the backend