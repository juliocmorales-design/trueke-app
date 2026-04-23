export function getUser() {
  let user = localStorage.getItem('user')

  if (!user) {
    user = 'user_' + Math.floor(Math.random() * 10000)
    localStorage.setItem('user', user)
  }

  return user
}