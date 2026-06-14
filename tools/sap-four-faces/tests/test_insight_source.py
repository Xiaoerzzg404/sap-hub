# -*- coding: utf-8 -*-
import json, os, tempfile, unittest, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import insight_source as ins


def _feed(items):
    return {"items": items}


class TestInsightSource(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.feed_path = os.path.join(self.tmp, "feed.json")
        self.consumed_path = os.path.join(self.tmp, "consumed.json")
        ins.FEED = self.feed_path
        ins.CONSUMED = self.consumed_path
        # point record_publish at a non-existent path so mark_published never
        # shells out to the real Insight Desk ledger during tests
        ins.RECORD_PUBLISH = os.path.join(self.tmp, "nope.js")

    def _write_feed(self, items):
        with open(self.feed_path, "w", encoding="utf-8") as f:
            json.dump(_feed(items), f)

    def _item(self, url, oa="not_published", blocked=False):
        return {
            "articleId": "id_" + url[-6:], "url": url, "canonicalUrl": url,
            "title": "T " + url[-6:], "region": "", "publishedAt": "2026-06-15",
            "publishStatus": {"wechatOfficialAccount": {"status": oa}},
            "reuseStatus": {"blocked": blocked},
        }

    def test_eligible_excludes_published_and_blocked(self):
        self._write_feed([
            self._item("https://news.sap.com/a/one"),                       # eligible
            self._item("https://news.sap.com/a/two", oa="draft_created"),   # published -> excluded
            self._item("https://news.sap.com/a/three", blocked=True),       # reuse-blocked -> excluded
            self._item("https://news.sap.com/a/four"),                      # eligible
        ])
        urls = {it["url"] for it in ins.eligible("wechat_official_account")}
        self.assertEqual(urls, {"https://news.sap.com/a/one", "https://news.sap.com/a/four"})

    def test_local_consumed_safety_net(self):
        self._write_feed([self._item("https://news.sap.com/a/one"),
                          self._item("https://news.sap.com/a/four")])
        # mark one consumed (dry-run avoids invoking record_publish.js)
        ins.mark_published("https://news.sap.com/a/one", "wechat_official_account",
                           "test-batch", article_id="id_xxx", dry_run=False)
        urls = {it["url"] for it in ins.eligible("wechat_official_account")}
        self.assertEqual(urls, {"https://news.sap.com/a/four"})

    def test_canon(self):
        self.assertEqual(ins.canon("https://news.sap.com/A/One/?x=1#f"),
                         "https://news.sap.com/a/one")


if __name__ == "__main__":
    unittest.main()
