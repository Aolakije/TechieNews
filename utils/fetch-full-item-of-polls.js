export async function FetchFullItemsOfPolls(globalUrl, pollsItem, nbr) {
  let liste = [];
  // on prend les id de pollsItem et on fetch urlGlobal avec cette id
  for (let i = 0; i < pollsItem.length; i++) {
    if (liste.length < nbr) {
      try {
        const itemResponse = await fetch(`${globalUrl}${pollsItem[i]}.json`);
        const data = await itemResponse.json();
        liste.push(data);
      } catch (error) {
        console.log(error);
      }
    } else {
      return liste;
    }
  }
  return liste;
}
