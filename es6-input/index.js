class Potato {
  constructor() {
    this.potats = ['mashed', 'baked', 'roasted', 'chonkers'];
  }

  spuds() {
    return this.potats;
  }
}

const potato = new Potato();

const spuds = potato.spuds();

const favPotato = spuds.find((lilSpud) => lilSpud === 'chonkers');

console.log('Favorite Potato:', favPotato)
