const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Retrieve a record.
   *
   * @return {Object}
   */

  async findSlug(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.services.post.findOne({ slug });
    return sanitizeEntity(entity, { model: strapi.models.post });
  },

  // when a post is created, the authenticated user is automatically set as author of the post
  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      data.author = ctx.state.user.id;
      entity = await strapi.services.post.create(data, { files });
    } else {
      ctx.request.body.author = ctx.state.user.id;
      entity = await strapi.services.post.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.post });
  },

  // restrict the update of posts only for the author
  async update(ctx) {
    const { id } = ctx.params;

    let entity;

    const [post] = await strapi.services.post.find({
      id: ctx.params.id,
      'author.id': ctx.state.user.id,
    });

    if (!post) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.post.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.post.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.post });
  },

  //create comment for posts
  async comment(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.comment.create(data, { files });
    } else {
    	ctx.request.body.author = ctx.state.user.id;
    	ctx.request.body.post = ctx.params.id;
      entity = await strapi.services.comment.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.comment });
  }

};