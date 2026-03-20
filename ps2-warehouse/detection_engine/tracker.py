import numpy as np


class BoxTracker:
    """
    Tracks unique boxes across frames using centroid distance.
    A box is counted once when it enters the frame.
    Implements a patience window to survive brief occlusions.
    """

    def __init__(self, max_disappeared: int = 30, min_distance: float = 60.0):
        self.next_id = 0
        self.objects: dict[int, np.ndarray] = {}      # id -> centroid
        self.disappeared: dict[int, int] = {}          # id -> frame count missing
        self.counted_ids: set[int] = set()             # ids that have been counted
        self.max_disappeared = max_disappeared
        self.min_distance = min_distance

    def update(self, centroids: list[tuple[float, float]], frame_idx: int) -> tuple[int, int]:
        """
        centroids: list of (cx, cy) from current frame detections
        Returns: (total_unique_count, currently_visible_count)
        """
        if len(centroids) == 0:
            for obj_id in list(self.disappeared):
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    del self.objects[obj_id]
                    del self.disappeared[obj_id]
            return len(self.counted_ids), 0

        input_centroids = np.array(centroids)

        if len(self.objects) == 0:
            for c in input_centroids:
                self._register(c)
        else:
            object_ids = list(self.objects.keys())
            object_centroids = np.array(list(self.objects.values()))

            # Compute pairwise distances
            D = np.linalg.norm(object_centroids[:, None] - input_centroids[None, :], axis=2)
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows, used_cols = set(), set()
            for r, c in zip(rows, cols):
                if r in used_rows or c in used_cols:
                    continue
                if D[r, c] > self.min_distance:
                    continue
                obj_id = object_ids[r]
                self.objects[obj_id] = input_centroids[c]
                self.disappeared[obj_id] = 0
                used_rows.add(r)
                used_cols.add(c)

            unused_rows = set(range(len(object_ids))) - used_rows
            unused_cols = set(range(len(input_centroids))) - used_cols

            for r in unused_rows:
                obj_id = object_ids[r]
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    del self.objects[obj_id]
                    del self.disappeared[obj_id]

            for c in unused_cols:
                self._register(input_centroids[c])

        return len(self.counted_ids), len(self.objects)

    def _register(self, centroid: np.ndarray):
        self.objects[self.next_id] = centroid
        self.disappeared[self.next_id] = 0
        self.counted_ids.add(self.next_id)
        self.next_id += 1

    def reset(self):
        self.__init__()
