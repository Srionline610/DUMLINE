import os
import zipfile
import tempfile
import sys

def create_and_verify_zip():
    zip_path = "DUMLINE-Submission.zip"
    pdf_source = "docs/Technical-Design-Document.pdf"
    deploy_source = "deployment.md"

    if not os.path.exists(pdf_source):
        print(f"Error: {pdf_source} does not exist.")
        sys.exit(1)
    if not os.path.exists(deploy_source):
        print(f"Error: {deploy_source} does not exist.")
        sys.exit(1)

    # 1. Create ZIP
    print(f"Creating {zip_path}...")
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(pdf_source, arcname="Technical-Design-Document.pdf")
        zf.write(deploy_source, arcname="deployment.md")

    # 2. Verify ZIP
    file_size_bytes = os.path.getsize(zip_path)
    file_size_mb = file_size_bytes / (1024 * 1024)
    print(f"Archive Size: {file_size_bytes} bytes ({file_size_mb:.3f} MB)")

    if file_size_mb > 25:
        print(f"Error: Archive size exceeds 25 MB limit! ({file_size_mb:.2f} MB)")
        sys.exit(1)

    # Inspect contents
    with zipfile.ZipFile(zip_path, 'r') as zf:
        namelist = zf.namelist()
        print(f"Files in ZIP ({len(namelist)}): {namelist}")
        
        expected_files = {"Technical-Design-Document.pdf", "deployment.md"}
        if set(namelist) != expected_files:
            print(f"Error: Unexpected contents in ZIP. Found {namelist}, expected {expected_files}")
            sys.exit(1)

        # Test extraction
        with tempfile.TemporaryDirectory() as tmpdir:
            zf.extractall(tmpdir)
            extracted_pdf = os.path.join(tmpdir, "Technical-Design-Document.pdf")
            extracted_deploy = os.path.join(tmpdir, "deployment.md")

            if not os.path.exists(extracted_pdf) or os.path.getsize(extracted_pdf) == 0:
                print("Error: Extracted PDF is missing or empty.")
                sys.exit(1)

            if not os.path.exists(extracted_deploy) or os.path.getsize(extracted_deploy) == 0:
                print("Error: Extracted deployment.md is missing or empty.")
                sys.exit(1)

            with open(extracted_deploy, 'r', encoding='utf-8') as f:
                content = f.read()
                if "https://github.com/Srionline610/DUMLINE.git" not in content:
                    print("Error: GitHub repo URL missing in deployment.md")
                    sys.exit(1)

            print("ZIP extraction & content integrity test PASSED.")

    print("\nSUCCESS: DUMLINE-Submission.zip is verified and fully compliant with Phase 20 requirements!")

if __name__ == "__main__":
    create_and_verify_zip()

