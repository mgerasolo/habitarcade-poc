import { Router } from 'express';
import { db } from '../db';
import { videos } from '../db/schema';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';

const router = Router();

// Helper to extract video info from URL
function parseVideoUrl(url: string): { platform: string; videoId: string } | null {
  try {
    const urlObj = new URL(url);

    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.includes('/shorts/')) {
        videoId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      if (videoId) {
        return { platform: 'youtube', videoId };
      }
    }

    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').filter(Boolean).pop();
      if (videoId) {
        return { platform: 'vimeo', videoId };
      }
    }

    // Instagram Reels
    if (urlObj.hostname.includes('instagram.com')) {
      const match = urlObj.pathname.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
      if (match) {
        return { platform: 'instagram', videoId: match[2] };
      }
    }

    // TikTok
    if (urlObj.hostname.includes('tiktok.com')) {
      const match = urlObj.pathname.match(/\/video\/(\d+)/);
      if (match) {
        return { platform: 'tiktok', videoId: match[1] };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// GET /api/videos - List all videos
router.get('/', async (req, res) => {
  try {
    const { category, favorites, search, platform, limit, offset } = req.query;
    const includeDeleted = req.query.includeDeleted === 'true';

    const conditions = [];

    if (!includeDeleted) {
      conditions.push(eq(videos.isDeleted, false));
    }

    if (category) {
      conditions.push(eq(videos.category, category as string));
    }

    if (platform) {
      conditions.push(eq(videos.platform, platform as string));
    }

    if (favorites === 'true') {
      conditions.push(eq(videos.isFavorite, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(videos.title, `%${search}%`),
          ilike(videos.description, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await db.query.videos.findMany({
      where: whereClause,
      orderBy: [desc(videos.createdAt)],
      limit: limitNum,
      offset: offsetNum,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(whereClause);

    res.json({
      data: result,
      count: result.length,
      total: Number(countResult[0]?.count || 0),
    });
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/videos/random - Get a random video
router.get('/random', async (req, res) => {
  try {
    const { category, favorites, platform } = req.query;

    const conditions = [eq(videos.isDeleted, false)];

    if (category) {
      conditions.push(eq(videos.category, category as string));
    }

    if (platform) {
      conditions.push(eq(videos.platform, platform as string));
    }

    if (favorites === 'true') {
      conditions.push(eq(videos.isFavorite, true));
    }

    const whereClause = and(...conditions);

    const result = await db.query.videos.findMany({
      where: whereClause,
      orderBy: [sql`RANDOM()`],
      limit: 1,
    });

    if (result.length === 0) {
      return res.status(404).json({ error: 'No videos found', code: 'NOT_FOUND' });
    }

    res.json({ data: result[0] });
  } catch (error) {
    console.error('Failed to fetch random video:', error);
    res.status(500).json({ error: 'Failed to fetch random video', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/videos/categories - Get unique categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db
      .selectDistinct({ category: videos.category })
      .from(videos)
      .where(and(eq(videos.isDeleted, false), sql`${videos.category} IS NOT NULL`))
      .orderBy(videos.category);

    const categories = result.map(r => r.category).filter(Boolean);
    res.json({ data: categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/videos/platforms - Get unique platforms
router.get('/platforms', async (req, res) => {
  try {
    const result = await db
      .selectDistinct({ platform: videos.platform })
      .from(videos)
      .where(and(eq(videos.isDeleted, false), sql`${videos.platform} IS NOT NULL`))
      .orderBy(videos.platform);

    const platforms = result.map(r => r.platform).filter(Boolean);
    res.json({ data: platforms });
  } catch (error) {
    console.error('Failed to fetch platforms:', error);
    res.status(500).json({ error: 'Failed to fetch platforms', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/videos/:id - Get single video
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.videos.findFirst({
      where: eq(videos.id, req.params.id),
    });
    if (!result) {
      return res.status(404).json({ error: 'Video not found', code: 'VIDEO_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch video:', error);
    res.status(500).json({ error: 'Failed to fetch video', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/videos - Create video
router.post('/', async (req, res) => {
  try {
    const { url, title, description, category, isFavorite } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Video URL is required', code: 'VALIDATION_ERROR' });
    }

    // Parse video URL to extract platform and ID
    const parsed = parseVideoUrl(url);

    const [result] = await db.insert(videos).values({
      url,
      platform: parsed?.platform || null,
      videoId: parsed?.videoId || null,
      title,
      description,
      category,
      isFavorite: isFavorite || false,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create video:', error);
    res.status(500).json({ error: 'Failed to create video', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/videos/bulk - Bulk import videos
router.post('/bulk', async (req, res) => {
  try {
    const { videos: videosToImport } = req.body;

    if (!Array.isArray(videosToImport) || videosToImport.length === 0) {
      return res.status(400).json({ error: 'Videos array is required', code: 'VALIDATION_ERROR' });
    }

    const validVideos = videosToImport
      .filter(v => v.url)
      .map(v => {
        const parsed = parseVideoUrl(v.url);
        return {
          url: v.url,
          platform: parsed?.platform || v.platform || null,
          videoId: parsed?.videoId || v.videoId || null,
          title: v.title || null,
          description: v.description || null,
          category: v.category || null,
          thumbnailUrl: v.thumbnailUrl || null,
          duration: v.duration || null,
          isFavorite: v.isFavorite || false,
        };
      });

    if (validVideos.length === 0) {
      return res.status(400).json({ error: 'No valid videos found', code: 'VALIDATION_ERROR' });
    }

    const result = await db.insert(videos).values(validVideos).returning();

    res.status(201).json({
      data: result,
      count: result.length,
      message: `Imported ${result.length} videos`,
    });
  } catch (error) {
    console.error('Failed to bulk import videos:', error);
    res.status(500).json({ error: 'Failed to import videos', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/videos/:id - Update video
router.patch('/:id', async (req, res) => {
  try {
    const { url, title, description, category, thumbnailUrl, duration, isFavorite } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (url !== undefined) {
      updateData.url = url;
      const parsed = parseVideoUrl(url);
      if (parsed) {
        updateData.platform = parsed.platform;
        updateData.videoId = parsed.videoId;
      }
    }
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) updateData.duration = duration;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const [result] = await db.update(videos)
      .set(updateData)
      .where(eq(videos.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Video not found', code: 'VIDEO_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update video:', error);
    res.status(500).json({ error: 'Failed to update video', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/videos/:id/favorite - Toggle favorite
router.post('/:id/favorite', async (req, res) => {
  try {
    const current = await db.query.videos.findFirst({
      where: eq(videos.id, req.params.id),
    });

    if (!current) {
      return res.status(404).json({ error: 'Video not found', code: 'VIDEO_NOT_FOUND' });
    }

    const [result] = await db.update(videos)
      .set({
        isFavorite: !current.isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, req.params.id))
      .returning();

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/videos/:id - Soft delete video
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(videos)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(videos.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Video not found', code: 'VIDEO_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete video:', error);
    res.status(500).json({ error: 'Failed to delete video', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/videos/:id/restore - Restore soft-deleted video
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(videos)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(videos.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Video not found', code: 'VIDEO_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore video:', error);
    res.status(500).json({ error: 'Failed to restore video', code: 'INTERNAL_ERROR' });
  }
});

export default router;
