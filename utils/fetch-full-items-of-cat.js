// ici on recupere la liste des id disponible dans caturl qui contient tout les id de la cat specifié (c'est donc un tableau)
// on utilise les id dans le fetch de lurl global pour retrouver les objets correspondant
// ps: les id dans categories l'index 0 represente l'article le plus recent
export async function FetchFullItemsOfCat(globalUrl, catUrl, nbr) {
  let liste = [];
  let idsData;
  try {
    const ids = await fetch(catUrl);
    idsData = await ids.json();
  } catch (error) {
    console.log(error);
  }
  for (let i = 0; i < nbr && i < idsData.length; i++) {
    // ex: url = https://hacker-news.firebaseio.com/v0/item/numero a l'index i de edsData.json
    try {
      const article = await fetch(`${globalUrl}${idsData[i]}.json`);
      const articleData = await article.json();
      liste.push(articleData);
    } catch (error) {
      console.log(error);
    }
  }
  return liste;
}
