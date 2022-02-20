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
    // fetchTodos();
  }

  async function deleteTodo({ id }: {id: string}) {
    const newTodosArray = todos.filter(todo => todo.id !== id);
    setTodos(newTodosArray);
    await API.graphql({ query: deleteTodoMutation, variables: { input: { id } }});
  }

  return (
    <div >
    <Authenticator className='fixed top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 '>
      {({ signOut, user }) => (
        <div className="sm:container mx-auto">
          <div className='w-10/12 md:max-w-screen-sm mx-auto'>

            <div className='flex flex-row-reverse'>
              <button onClick={signOut} className='text-right bg-red-600 rounded-md text-white py-1 px-3 mt-1'>Sign out</button>
            </div>
            
            <h1 className='text-center my-6 font-bold text-2xl text-orange-300'>Todo Maker</h1>

            <form className='bg-white bg-opacity-40 rounded-lg p-3 shadow-lg mb-6'>
                <label className='block mb-1'>Todo Name</label>
                <input
                  onChange={e => setFormData({ ...formData, 'name': e.target.value})}
                  placeholder="Todo name"
                  value={formData.name}
                  className='block rounded-md mb-3 w-full p-1'
                />
                <label className='block mb-1'>Todo Description</label>
                <input
                  onChange={e => setFormData({ ...formData, 'description': e.target.value})}
                  placeholder="Todo description"
                  value={formData.description}
                  className='block rounded-md mb-3 w-full p-1'
                />
                <label className='block mb-1'>Add a picture to your todo (optional)</label>
                <input
                  type='file'
                  onChange={onChange}
                  className='block mb-5 file:rounded-full file:border-0 file:bg-red-200 hover:file:bg-red-300 text-slate-500'
                />
                <div className='flex justify-center'>
                  <button onClick={createTodo} className='rounded-full bg-orange-300 py-2 px-4'>Create Todo</button>
                </div>
            </form>
          
            <div>
              {
                todos.map(todo => todo.id && (
                  <div key={todo.id} className=' bg-white rounded-md shadow-md mb-3 py-2 px-4'>
                    <h2>{todo.name}</h2>
                    <div className='border border-slate-100 my-1'></div>
                    <p>{todo.description}</p>
                    {todo.image && <img src={todo.image} className='w-fit mt-2 md:max-w-md md:mx-auto' />}
                    <div className='flex justify-center mt-2'>
                      <button onClick={() => deleteTodo(todo)} className='rounded bg-red-500 text-white py-1 px-2'>Delete</button>
                    </div>
                  </div>
                ))
              }
            </div>

          </div>
        </div>
      )}
    </Authenticator>
    </div>
  );
}

export default App;