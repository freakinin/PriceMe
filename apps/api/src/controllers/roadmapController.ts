import { Response } from 'express';
import { db } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getRoadmapFeatures = async (req: AuthRequest, res: Response) => {
  try {
    const searchQuery = req.query.search as string | undefined;
    
    let features;
    if (searchQuery) {
      features = await db`
        SELECT 
          rf.id,
          rf.name,
          rf.description,
          rf.upvotes,
          rf.downvotes,
          rf.created_at,
          rf.updated_at,
          CASE WHEN rv.vote_type = 'up' THEN true ELSE false END as user_voted_up,
          CASE WHEN rv.vote_type = 'down' THEN true ELSE false END as user_voted_down
        FROM roadmap_features rf
        LEFT JOIN roadmap_votes rv ON rf.id = rv.feature_id AND rv.user_id = ${req.userId}
        WHERE rf.name ILIKE ${`%${searchQuery}%`} OR rf.description ILIKE ${`%${searchQuery}%`}
        ORDER BY (rf.upvotes - rf.downvotes) DESC, rf.created_at DESC
      `;
    } else {
      features = await db`
        SELECT 
          rf.id,
          rf.name,
          rf.description,
          rf.upvotes,
          rf.downvotes,
          rf.created_at,
          rf.updated_at,
          CASE WHEN rv.vote_type = 'up' THEN true ELSE false END as user_voted_up,
          CASE WHEN rv.vote_type = 'down' THEN true ELSE false END as user_voted_down
        FROM roadmap_features rf
        LEFT JOIN roadmap_votes rv ON rf.id = rv.feature_id AND rv.user_id = ${req.userId}
        ORDER BY (rf.upvotes - rf.downvotes) DESC, rf.created_at DESC
      `;
    }

    const featuresList = Array.isArray(features) ? features : features.rows || [];

    res.json({
      status: 'success',
      data: featuresList.map((feature: any) => ({
        id: feature.id,
        name: feature.name,
        description: feature.description,
        upvotes: Number(feature.upvotes) || 0,
        downvotes: Number(feature.downvotes) || 0,
        createdAt: feature.created_at,
        updatedAt: feature.updated_at,
        userVotedUp: feature.user_voted_up || false,
        userVotedDown: feature.user_voted_down || false,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching roadmap features:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch roadmap features',
      error: error.message,
    });
  }
};

export const voteOnFeature = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const { featureId } = req.params;
    const { voteType } = req.body; // 'up' or 'down'

    if (!voteType || !['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid vote type. Must be "up" or "down"',
      });
    }

    // Check if user already voted
    const existingVote = await db`
      SELECT vote_type FROM roadmap_votes
      WHERE feature_id = ${featureId} AND user_id = ${req.userId}
    `;
    const existingVoteList = Array.isArray(existingVote) ? existingVote : existingVote.rows || [];

    if (existingVoteList.length > 0) {
      const currentVoteType = existingVoteList[0].vote_type;
      
      // If voting the same way, remove the vote
      if (currentVoteType === voteType) {
        await db`
          DELETE FROM roadmap_votes
          WHERE feature_id = ${featureId} AND user_id = ${req.userId}
        `;

        // Update feature vote counts
        if (voteType === 'up') {
          await db`
            UPDATE roadmap_features
            SET upvotes = GREATEST(0, upvotes - 1)
            WHERE id = ${featureId}
          `;
        } else {
          await db`
            UPDATE roadmap_features
            SET downvotes = GREATEST(0, downvotes - 1)
            WHERE id = ${featureId}
          `;
        }

        return res.json({
          status: 'success',
          message: 'Vote removed',
        });
      } else {
        // Change vote type
        await db`
          UPDATE roadmap_votes
          SET vote_type = ${voteType}
          WHERE feature_id = ${featureId} AND user_id = ${req.userId}
        `;

        // Update feature vote counts
        if (currentVoteType === 'up') {
          await db`
            UPDATE roadmap_features
            SET upvotes = GREATEST(0, upvotes - 1),
                downvotes = downvotes + 1
            WHERE id = ${featureId}
          `;
        } else {
          await db`
            UPDATE roadmap_features
            SET upvotes = upvotes + 1,
                downvotes = GREATEST(0, downvotes - 1)
            WHERE id = ${featureId}
          `;
        }

        return res.json({
          status: 'success',
          message: 'Vote updated',
        });
      }
    }

    // New vote
    await db`
      INSERT INTO roadmap_votes (feature_id, user_id, vote_type)
      VALUES (${featureId}, ${req.userId}, ${voteType})
    `;

    // Update feature vote counts
    if (voteType === 'up') {
      await db`
        UPDATE roadmap_features
        SET upvotes = upvotes + 1
        WHERE id = ${featureId}
      `;
    } else {
      await db`
        UPDATE roadmap_features
        SET downvotes = downvotes + 1
        WHERE id = ${featureId}
      `;
    }

    res.json({
      status: 'success',
      message: 'Vote recorded',
    });
  } catch (error: any) {
    console.error('Error voting on feature:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record vote',
      error: error.message,
    });
  }
};
