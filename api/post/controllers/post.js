const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const { summary, streakRanges, trackRecord } = require('date-streaks');

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
  },

  //custom query to find anything
  async custom(ctx) {
    const { custom } = ctx.params;

    console.log(custom);

    const users = await strapi.query('post').count({content_contains: 'api'});
    
    return users;
  },

  //execute raw db query on posts via bookshelf instance
  async streak(ctx) {
    const { streak } = ctx.params;

    console.log(streak);

    /*
    // Demo example from date-streaks package
    const dates = [
    	 "2020-10-30T11:00:00.193Z",
    	 "2020-10-31T13:30:09.589Z",
    	 "2020-11-01T15:29:20.990Z"
    ]

    return summary(dates);
    */

    // raw SQL queryto get pub;ished at dates
    const rawDates = await strapi.connections.default.raw("SELECT published_at FROM posts WHERE author='1' ORDER BY published_at ASC"); 
    
    // using map() method to extract an array of dates from the results set of the db query
    const dates = rawDates.rows.map(row => row.published_at);

    // doing this so that I can return all 3 functions at the end
    const summaryDates = summary(dates);
    const streakrangesDates = streakRanges(dates);

    // params to get trackRecord properly
    const length = 10;
    const endDate = new Date('2020-11-05T15:29:20.990Z');
    const trackrecordDates = trackRecord({ dates, length, endDate });

    return { summaryDates, streakrangesDates, trackrecordDates };

  }

};