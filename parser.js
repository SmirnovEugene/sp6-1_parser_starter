// @todo: напишите здесь код парсера
const head = document.querySelector("head"),
  body = document.querySelector("body");

const meta = getMeta(head);
const product = getProduct(body);
const suggested = getSuggested(body);
const reviews = getReviews(body);

function curs(el) {
  let cur;

  if (el.includes("₽")) {
    cur = "RUB";
    return cur;
  } else if (el.includes("€")) {
    cur = "EUR";
    return cur;
  } else if (el.includes("$")) {
    cur = "USD";
    return cur;
  }
}

function getMetaName(name, el) {
  return el.querySelector(`[name=${name}]`).content;
}

function getMeta(el) {
  const title = el
    .querySelector("title")
    .textContent.slice(0, el.querySelector("title").textContent.indexOf("—"))
    .trim();
  const description = getMetaName("description", el);
  const keywords = getMetaName("keywords", el).split(", ");
  const lang = document.querySelector("html").lang;
  const image = el.querySelector('[property="og:image"]').content;
  const type = el.querySelector('[property="og:type"]').content;

  return {
    title: title,
    description: description,
    keywords: keywords,
    language: lang,
    opengraph: {
      title: title,
      image: image,
      type: type,
    },
  };
}

function getProduct(el) {
  const arrImage = Array.from(el.querySelectorAll("nav img")).reduce(
    (acc, item) => {
      const dis = item.parentNode.hasAttribute("disabled");
      if (dis) {
        acc.unshift({
          preview: item.src,
          full: item.dataset.src,
          alt: item.alt,
        });
      } else {
        acc.push({
          preview: item.src,
          full: item.dataset.src,
          alt: item.alt,
        });
      }
      return acc;
    },
    []
  );
  const tags = Array.from(el.querySelector(".tags").children).reduce(
    (acc, item) => {
      switch (item.className) {
        case "green":
          acc.category.push(item.textContent);
          break;
        case "blue":
          acc.label.push(item.textContent);
          break;
        case "red":
          acc.discount.push(item.textContent);
          break;
      }

      return acc;
    },
    {
      category: [],
      discount: [],
      label: [],
    }
  );
  const price = el
    .querySelector(".price")
    .textContent.match(/\d+/g)
    .sort((a, b) => b - a)
    .reduce(
      (acc, item) => {
        if (!acc.oldPrice) {
          acc.oldPrice = item;
        } else {
          acc.price = item;
          acc.discount = acc.oldPrice - acc.price;
        }
        if (acc.discount) {
          acc.discountPercent = `${(
            (acc.discount * 100) /
            acc.oldPrice
          ).toFixed(2)}%`;
        }

        return acc;
      },
      {
        price: 0,
        oldPrice: 0,
        discount: 0,
        discountPercent: "0%",
      }
    );

  const currency = () => {
    const val = el.querySelector(".price span").textContent;
    return curs(val);
  };
  const properties = Array.from(
    el.querySelector(".properties").children
  ).reduce((acc, item) => {
    acc[item.children[0].textContent] = item.children[1].textContent;
    return acc;
  }, {});
  // удаление аттрибута в html колекции
  const desc = el.querySelector(".description");
  const description = (el) => {
    const dupNode = el.cloneNode(true);
    dupNode.childNodes[0].remove();
    const l = dupNode.childNodes.length - 1;
    dupNode.childNodes[l].remove();

    for (let i = 0; i < el.children.length; i++) {
      for (let j = 0; j < el.children[i].attributes.length; j++) {
        dupNode.children[i].removeAttribute(el.children[i].attributes[j].name);
      }
    }
    return dupNode.innerHTML;
  };

  return {
    id: el.querySelector("[data-id]").dataset.id,
    name: el.querySelector("h1").textContent,
    isLiked: el.querySelector(".like").classList.contains("active"),
    tags: tags,
    price: +price.price,
    oldPrice: +price.oldPrice,
    discount: price.discount,
    discountPercent: price.discountPercent,
    currency: currency(),
    properties: properties,
    description: description(desc),
    images: arrImage,
  };
}

function getSuggested(el) {
  const articles = el.querySelectorAll(".suggested article");
  let arrArticle = [];
  for (let i = 0; i < articles.length; i++) {
    let objArticle = {
      name: articles[i].querySelector("h3").textContent,
      description: articles[i].querySelector("p").textContent,
      image: articles[i].querySelector("img").src,
      price: articles[i].querySelector("b").textContent.match(/\d+/g).join(),
      currency: curs(articles[i].querySelector("b").textContent),
    };
    arrArticle.push(objArticle);
  }

  return arrArticle;
}

function getReviews(el) {
  const reviews = el.querySelectorAll(".reviews article");
  let arrReviews = [];
  for (let i = 0; i < reviews.length; i++) {
    const rating = Array.from(
      reviews[i].querySelector(".rating").children
    ).reduce((acc, item) => {
      if (item.className == "filled") {
        acc += 1;
      }
      return acc;
    }, 0);
    const re = /\//g;
    let objReviews = {
      rating: rating,
      author: {
        avatar: reviews[i].querySelector(".author img").src,
        name: reviews[i].querySelector(".author span").textContent,
      },
      title: reviews[i].querySelector("h3").textContent,
      description: reviews[i].querySelector("p").textContent,
      date: reviews[i].querySelector(".author i").textContent.replace(re, "."),
    };

    arrReviews.push(objReviews);
  }

  return arrReviews;
}

function parsePage() {
  return {
    meta: meta,
    product: product,
    suggested: suggested,
    reviews: reviews,
  };
}

window.parsePage = parsePage;
