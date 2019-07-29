const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const name = this.get('name') || '';

    const model = this.model('goods');
    const data = await model.where({ name: ['like', `%${name}%`] }).order(['id DESC']).page(page, size).countSelect();

    return this.success(data);
  }

  async saveGalleryAction() {
    const values = this.post()

    const gallery = this.model('goods_gallery')

    if (values.id) {
      await gallery.where({ id: values.id }).update(values)
      return this.success(values)
    }

    const id = await gallery.add(values)
    const goodsGallery = await gallery.where({ id }).find()

    this.success(goodsGallery)
  }

  async deleteGalleryAction() {
    const id = this.get('id')
    await this.model('goods_gallery').where({ id }).delete()

    this.success()
  }

  async detailAction() {
    const id = this.get('id');
    const model = this.model('goods');
    const product = await model.where({ id: id }).find();
    if (product.goods_desc) {
      product.goods_desc = JSON.parse(product.goods_desc)
    } else {
      product.goods_desc = []
    }
    const galleries = await this.model('goods_gallery').where({ goods_id: id }).select();

    return this.success({
      product, galleries
    })
  }

  async infoAction() {
    const id = this.get('id');
    const model = this.model('goods');
    const data = await model.where({ id: id }).find();

    return this.success(data);
  }

  async storeAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('goods');
    values.is_on_sale = values.is_on_sale ? 1 : 0;
    values.is_new = values.is_new ? 1 : 0;
    values.is_hot = values.is_hot ? 1 : 0;

    values.goods_desc = JSON.stringify(values.goods_desc)

    if (id > 0) {
      await model.where({ id: id }).update(values);
    } else {
      delete values.id;
      const goods_id = await model.add(values);
      await this.model('product').add({
        goods_id,
        goods_sn: goods_id,
        goods_number: values.goods_number,
        retail_price: values.retail_price
      })
    }
    return this.success(values);
  }

  async destoryAction() {
    const id = this.post('id');
    await this.model('goods').where({ id: id }).limit(1).delete();
    // TODO 删除图片

    return this.success();
  }

  async structGoodsDescAction() {

    const model = this.model('goods')

    const products = await model.select()

    products.forEach(product => {
      const result = product.goods_desc.match(/http:\/\/yanxuan\.nosdn\.127\.net\/[\w\d]+\.jpg/g)
      if (result) {
        const links = [...new Set(result)]
        product.goods_desc = JSON.stringify(links)

        model.where({id: product.id}).update(product)
      }

    })

    this.success()
  }
};
