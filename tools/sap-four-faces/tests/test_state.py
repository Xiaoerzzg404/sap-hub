"""Unit tests for sap-four-faces (HANDOFF §10).

Covers:
- Per-face completion judgment (face1..face4).
- finalize refuses to write .published / .channels-published when any
  face is not done.
- deep_dedup hits a duplicate URL (Face3 §8 gate).
- plan(face1) outputs needs_content when main md is missing.

Stdlib unittest only — no external deps. Works on /usr/bin/python3 (3.9.6).
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Dict
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def _patch_dirs(tmp: Path):
    """Override STUDIO + PIPE roots inside the freshly imported config."""
    import config

    config.STUDIO = tmp / "studio"
    config.PIPE = tmp / "pipe"
    config.STUDIO_SCRIPTS = config.STUDIO / "scripts"
    config.PIPE_SCRIPTS = config.PIPE / "scripts"
    # Make markers/state route through the patched PIPE.
    (config.STUDIO / "data" / "drafts").mkdir(parents=True, exist_ok=True)
    (config.STUDIO / "data" / "per-article").mkdir(parents=True, exist_ok=True)
    (config.PIPE / "input").mkdir(parents=True, exist_ok=True)
    (config.PIPE / "working").mkdir(parents=True, exist_ok=True)


class TempEnv(unittest.TestCase):
    edition = "2026-06-14"

    def setUp(self):
        # Force a clean reimport of config/faces so patched paths take hold.
        for mod in list(sys.modules):
            if mod == "config" or mod.startswith("faces") or mod == "sap_four_faces":
                del sys.modules[mod]
        self.tmpdir = tempfile.TemporaryDirectory()
        self.tmp = Path(self.tmpdir.name)
        import config  # noqa: F401 - import first so we can patch

        _patch_dirs(self.tmp)

    def tearDown(self):
        self.tmpdir.cleanup()


# --------------------------------------------------------------------------
# Face1
# --------------------------------------------------------------------------
class TestFace1Judge(TempEnv):
    def test_pending_without_md(self):
        import config
        from faces import face1
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        status, info = face1.judge(state, self.edition)
        self.assertEqual(status, "needs_content")
        self.assertEqual(info["draftPath"], str(config.main_article_md(self.edition)))

    def test_ready_with_md(self):
        import config
        from faces import face1
        import sap_four_faces

        md = config.main_article_md(self.edition)
        md.parent.mkdir(parents=True, exist_ok=True)
        md.write_text("dummy", encoding="utf-8")
        state = sap_four_faces.empty_state(self.edition)
        status, _ = face1.judge(state, self.edition)
        self.assertEqual(status, "ready")

    def test_done_when_media_id(self):
        from faces import face1
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        state["faces"]["face1"]["mediaId"] = "MEDIA_ABC"
        status, info = face1.judge(state, self.edition)
        self.assertEqual(status, "done")
        self.assertEqual(info["mediaId"], "MEDIA_ABC")


# --------------------------------------------------------------------------
# Face2
# --------------------------------------------------------------------------
class TestFace2Judge(TempEnv):
    def test_ready_without_confirmation(self):
        from faces import face2
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        status, _ = face2.judge(state, self.edition)
        self.assertEqual(status, "ready")

    def test_done_with_confirmation(self):
        import config
        from faces import face2
        import sap_four_faces

        work = config.working_dir(self.edition)
        work.mkdir(parents=True, exist_ok=True)
        (work / "hotnews_channels_live_confirmation_part01.json").write_text(
            json.dumps({"errCode": 0, "objectId": "OBJ_1"}), encoding="utf-8"
        )
        (work / "hotnews_channels_live_confirmation_part02.json").write_text(
            json.dumps({"errCode": 0, "objectId": "OBJ_2"}), encoding="utf-8"
        )
        state = sap_four_faces.empty_state(self.edition)
        status, info = face2.judge(state, self.edition)
        self.assertEqual(status, "done")
        self.assertEqual(info["objectIds"], ["OBJ_1", "OBJ_2"])

    def test_not_done_when_err_code_nonzero(self):
        import config
        from faces import face2
        import sap_four_faces

        work = config.working_dir(self.edition)
        work.mkdir(parents=True, exist_ok=True)
        (work / "hotnews_channels_live_confirmation_part01.json").write_text(
            json.dumps({"errCode": 17, "objectId": "OBJ_X"}), encoding="utf-8"
        )
        state = sap_four_faces.empty_state(self.edition)
        status, _ = face2.judge(state, self.edition)
        self.assertNotEqual(status, "done")


# --------------------------------------------------------------------------
# Face3
# --------------------------------------------------------------------------
class TestFace3Judge(TempEnv):
    def test_needs_content_when_dir_empty(self):
        from faces import face3
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        status, _ = face3.judge(state, self.edition)
        self.assertEqual(status, "needs_content")

    def test_ready_when_target_content_present(self):
        import config
        from faces import face3
        import sap_four_faces

        per = config.per_article_dir(self.edition)
        per.mkdir(parents=True, exist_ok=True)
        for i in range(1, face3.target_min() + 1):
            d = per / f"article_{i:02d}_v1"
            d.mkdir()
            (d / "content.json").write_text("{}", encoding="utf-8")
        state = sap_four_faces.empty_state(self.edition)
        status, _ = face3.judge(state, self.edition)
        self.assertEqual(status, "ready")

    def test_done_when_media_count_meets_target(self):
        from faces import face3
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        state["faces"]["face3"]["articles"] = [
            {"slug": f"article_{i:02d}_v1", "mediaId": f"M_{i}"}
            for i in range(1, face3.target_min() + 1)
        ]
        status, _ = face3.judge(state, self.edition)
        self.assertEqual(status, "done")


# --------------------------------------------------------------------------
# Face4
# --------------------------------------------------------------------------
class TestFace4Judge(TempEnv):
    def test_needs_content_when_no_input_json(self):
        from faces import face4
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        status, _ = face4.judge(state, self.edition)
        self.assertEqual(status, "needs_content")

    def test_ready_when_input_json_but_no_evidence(self):
        import config
        from faces import face4
        import sap_four_faces

        config.shorts_input_json(self.edition).parent.mkdir(parents=True, exist_ok=True)
        config.shorts_input_json(self.edition).write_text("{}", encoding="utf-8")
        state = sap_four_faces.empty_state(self.edition)
        status, _ = face4.judge(state, self.edition)
        self.assertEqual(status, "ready")

    def test_done_when_evidence_covers_events(self):
        import config
        from faces import face4
        import sap_four_faces

        # write events file
        events_path = config.short_video_events_path(self.edition)
        events_path.parent.mkdir(parents=True, exist_ok=True)
        events_path.write_text(
            json.dumps(
                {
                    "events": [
                        {"id": "e1", "sourceUrl": "https://example.com/a"},
                        {"id": "e2", "sourceUrl": "https://example.com/b"},
                    ]
                }
            ),
            encoding="utf-8",
        )
        shorts_root = config.working_dir(self.edition) / "shorts"
        for eid in ("e1", "e2"):
            sd = shorts_root / eid
            sd.mkdir(parents=True, exist_ok=True)
            (sd / "channels_draft_upload_evidence.json").write_text(
                "{}", encoding="utf-8"
            )
        state = sap_four_faces.empty_state(self.edition)
        status, info = face4.judge(state, self.edition)
        self.assertEqual(status, "done")
        self.assertEqual({e["eid"] for e in info["evidence"]}, {"e1", "e2"})


# --------------------------------------------------------------------------
# finalize refusal
# --------------------------------------------------------------------------
class TestFinalize(TempEnv):
    def _seed_face1_done(self, state):
        import config

        md = config.main_article_md(self.edition)
        md.parent.mkdir(parents=True, exist_ok=True)
        md.write_text("dummy", encoding="utf-8")
        state["faces"]["face1"]["mediaId"] = "M1"
        state["faces"]["face1"]["status"] = "done"

    def _seed_face2_done(self, state):
        import config

        work = config.working_dir(self.edition)
        work.mkdir(parents=True, exist_ok=True)
        (work / "hotnews_channels_live_confirmation_part01.json").write_text(
            json.dumps({"errCode": 0, "objectId": "OBJ_1"}), encoding="utf-8"
        )
        state["faces"]["face2"]["objectIds"] = ["OBJ_1"]
        state["faces"]["face2"]["status"] = "done"

    def _seed_face3_done(self, state):
        from faces import face3

        state["faces"]["face3"]["articles"] = [
            {"slug": f"article_{i:02d}_v1", "mediaId": f"M_{i}"}
            for i in range(1, face3.target_min() + 1)
        ]
        state["faces"]["face3"]["status"] = "done"

    def _seed_face4_done(self, state):
        import config

        events_path = config.short_video_events_path(self.edition)
        events_path.parent.mkdir(parents=True, exist_ok=True)
        events_path.write_text(
            json.dumps({"events": [{"id": "e1"}]}), encoding="utf-8"
        )
        shorts_root = config.working_dir(self.edition) / "shorts" / "e1"
        shorts_root.mkdir(parents=True, exist_ok=True)
        (shorts_root / "channels_draft_upload_evidence.json").write_text(
            "{}", encoding="utf-8"
        )
        state["faces"]["face4"]["shorts"] = [{"eid": "e1"}]
        state["faces"]["face4"]["status"] = "done"

    def test_finalize_refuses_when_face4_missing(self):
        import config
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        self._seed_face1_done(state)
        self._seed_face2_done(state)
        self._seed_face3_done(state)
        # face4 deliberately left pending
        sap_four_faces.save_state(state)

        rc = sap_four_faces.cmd_finalize(self.edition)
        self.assertEqual(rc, 4, "finalize must refuse with rc=4")
        self.assertFalse(
            config.published_marker(self.edition).exists(),
            ".published must NOT be written when face4 is incomplete",
        )
        self.assertFalse(
            config.channels_published_marker(self.edition).exists(),
            ".channels-published must NOT be written when face4 is incomplete",
        )

    def test_finalize_writes_markers_when_all_done(self):
        import config
        import sap_four_faces

        state = sap_four_faces.empty_state(self.edition)
        self._seed_face1_done(state)
        self._seed_face2_done(state)
        self._seed_face3_done(state)
        self._seed_face4_done(state)
        sap_four_faces.save_state(state)

        rc = sap_four_faces.cmd_finalize(self.edition)
        self.assertEqual(rc, 0)
        self.assertTrue(config.published_marker(self.edition).exists())
        self.assertTrue(config.channels_published_marker(self.edition).exists())


# --------------------------------------------------------------------------
# deep_dedup
# --------------------------------------------------------------------------
class TestDeepDedup(TempEnv):
    def test_hits_duplicate_from_per_article(self):
        import config
        from faces import _common as common

        dup = "https://news.sap.com/2026/06/sap-launches-joule-in-sap-for-me"
        # past day per-article content.json with that URL in refs
        past = (
            config.per_article_root()
            / "2026-06-13"
            / "article_01_v1"
        )
        past.mkdir(parents=True, exist_ok=True)
        (past / "content.json").write_text(
            json.dumps(
                {
                    "sources": {
                        "refs": [
                            ["official", f"SAP News {dup}"],
                            ["other", "background"],
                        ]
                    }
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        cand = [dup, "https://news.sap.com/2026/06/joule-everywhere"]
        new = common.deep_dedup(cand, self.edition, window=14)
        self.assertNotIn(dup, new)
        self.assertIn("https://news.sap.com/2026/06/joule-everywhere", new)

    def test_hits_duplicate_from_short_events(self):
        import config
        from faces import _common as common

        dup = "https://news.sap.com/poland/2026/06/dup"
        events_path = config.pipe_input_root() / "2026-06-10" / "short_video_events.json"
        events_path.parent.mkdir(parents=True, exist_ok=True)
        events_path.write_text(
            json.dumps(
                {"events": [{"id": "e1", "sourceUrl": dup}]}
            ),
            encoding="utf-8",
        )
        new = common.deep_dedup([dup, "https://news.sap.com/2026/06/new"], self.edition, window=14)
        self.assertNotIn(dup, new)

    def test_canonicalization_strips_utm(self):
        from faces import _common as common

        a = "https://news.sap.com/2026/06/X?utm_source=newsletter"
        b = "https://news.sap.com/2026/06/X"
        self.assertEqual(common.canonical_url(a), common.canonical_url(b))


if __name__ == "__main__":
    unittest.main()
