export function passwordError(password: string) {
  if (password.length < 8) return "Use pelo menos 8 caracteres na senha.";
  if (/^(.)\1+$/.test(password))
    return "Não use o mesmo caractere repetido na senha.";

  let ascending = 1;
  let descending = 1;
  const value = password.toLocaleLowerCase("pt-BR");
  for (let index = 1; index < value.length; index++) {
    const difference = value.charCodeAt(index) - value.charCodeAt(index - 1);
    ascending = difference === 1 ? ascending + 1 : 1;
    descending = difference === -1 ? descending + 1 : 1;
    if (ascending >= 4 || descending >= 4)
      return "Não use números ou letras em sequência na senha.";
  }
  return null;
}
