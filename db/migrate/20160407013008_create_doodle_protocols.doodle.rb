# This migration comes from doodle (originally 20160320175917)
class CreateDoodleProtocols < ActiveRecord::Migration
  def change
    create_table :doodle_protocols do |t|
      t.string :customer_login
      t.references :channel, index: true, foreign_key: true
      t.references :user, index: true, foreign_key: true
      t.string :conversation_id
      t.string :phone
      t.string :status
      t.datetime :in_progress_at
      t.datetime :finalized_at

      t.timestamps null: false
    end
  end
end
