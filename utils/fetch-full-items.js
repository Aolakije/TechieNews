export async function FetchFullItems(globalUrl, nbr) {
  let maxItem;
  // 1. Récupérer l'ID maximum donné par l'api
  try {
    const getMaxItem = await fetch(
      "https://hacker-news.firebaseio.com/v0/maxitem.json"
    );
    maxItem = await getMaxItem.json();
  } catch (error) {
    console.log(error);
  }
  let liste = [];
  // on part du dernier id et on boucle sur les 5 dernier id avec une limite a maxItem (id) - 500
  //  pour ne pas depasser 500 requete si le fetch ne fonctionne pas
  for (let i = maxItem; i > maxItem - 500 && liste.length < nbr; i--) {
    try {
      const itemResponse = await fetch(`${globalUrl}${i}.json`);
      const data = await itemResponse.json();
      liste.push(data);
    } catch (error) {
      console.log(error);
    }
  }
  return liste;
}
