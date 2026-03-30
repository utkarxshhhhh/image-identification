from main import format_predictions, validate_image_path


def test_format_predictions_outputs_readable_lines():
    preds = [
        ("n02099601", "golden_retriever", 0.91),
        ("n02123045", "tabby_cat", 0.07),
    ]
    lines = format_predictions(preds)
    assert lines == [
        "1. Golden Retriever: 91.00%",
        "2. Tabby Cat: 7.00%",
    ]


def test_validate_image_path_rejects_bad_extension(tmp_path):
    bad_file = tmp_path / "not-image.txt"
    bad_file.write_text("hello")

    try:
        validate_image_path(str(bad_file))
        assert False, "Expected ValueError for unsupported extension"
    except ValueError:
        assert True
